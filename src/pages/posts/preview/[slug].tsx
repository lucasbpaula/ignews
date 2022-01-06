import { GetStaticProps } from 'next';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import React, { useEffect } from 'react';
import { getPrismicClient } from '../../../services/prismic';
import Link from 'next/link';
import styles from '../post.module.scss';
import { useSession } from 'next-auth/client';
import { useRouter } from 'next/router';

interface PostPreviewProps {
    post: {
        slug: string;
        title: string;
        content: string;
        updatedAt: string;
    };
}

export default function PostPreview({ post }: PostPreviewProps) {
    const [session] = useSession();
    const route = useRouter();

    useEffect(() => {
        if (session?.activeSubscription) {
            route.push(`/posts/${post.slug}`);
        }
    }, [session]);

    return (
        <>
            <Head>
                <title>{post.title} | Ignews</title>
            </Head>

            <main className={styles.container}>
                <article className={styles.post}>
                    <h1>{post.title}</h1>
                    <time>{post.updatedAt}</time>

                    <div
                        className={`${styles.postContent} ${styles.previewContent}`}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    <div className={styles.continueReading}>
                        Wanna continue reading?
                        <Link href="/">
                            <a href="">Subscribe now 🤗</a>
                        </Link>
                    </div>
                </article>
            </main>
        </>
    );
}

export const getStaticPaths = () => {
    return {
        paths: [], // se passar os objetos com { params: slug: ''} ira gerar o arquivo staticamente ao buildar a aplicacao
        fallback: 'blocking',

        // true: se alguem tentar acessar o post que nao foi gerado de forma statica ele ira gerar em tempo real, causando layout shift
        // (mostrando conteudo nao preenchido e depois preenchido), gera problema com SEO pois o google nao consegue indexar algo q ainda nao foi gerado.
        // false: se o post nao foi gerado ainda ele retorna 404
        // 'blocking': tenta carregar o conteudo na camada serverSideRendering e somente mostra o conteudo apos gerar ele todo
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const { slug } = params;

    const prismic = getPrismicClient();

    const response = await prismic.getByUID('post', String(slug), {});
    const post = {
        slug,
        title: RichText.asText(response.data.title),
        content: RichText.asHtml(response.data.content.splice(0, 3)),
        updatedAt: new Date(response.last_publication_date).toLocaleDateString(
            'pt-BR',
            {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }
        ),
    };

    return {
        props: {
            post,
        },
        revalidate: 60 * 30, // 30 minutes
    };
};
