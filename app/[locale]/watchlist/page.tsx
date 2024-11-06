'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import { fetchWatchlist, subscribeToWatchlist } from '@/lib/FetchWatchlist';
import { Movie, Series } from '@/types/title';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import WatchlistButton from '@/components/AddToWatchlistButton';
import { Button } from '@/components/ui/button';

import { FaStar } from "react-icons/fa";


interface WatchlistItem {
  titleId: string;
  titleType: 'movie' | 'tv';
}

const Page = () => {
  const locale = useLocale();
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_ACCESS_TOKEN}`
    }
  };
  const [movies, setMovies] = useState([] as Movie[]);
  const [series, setSeries] = useState([] as Series[]);
  const [watchlist, setWatchlist] = useState([] as WatchlistItem[]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadWatchlist = async () => {
      const items = await fetchWatchlist(userId);
      setWatchlist(items);
      setLoading(false);
    };
    loadWatchlist();

    const unsubscribe = subscribeToWatchlist(userId, (items) => {
      setWatchlist(items);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const fetchTitles = async () => {
      if (watchlist.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const moviePromises = watchlist
          .filter(item => item.titleType === 'movie')
          .map(item =>
            fetch(`https://api.themoviedb.org/3/movie/${item.titleId}?language=${locale}`, options)
              .then(response => response.json())
          );

        const seriesPromises = watchlist
          .filter(item => item.titleType === 'tv')
          .map(item =>
            fetch(`https://api.themoviedb.org/3/tv/${item.titleId}?language=${locale}`, options)
              .then(response => response.json())
          );

        const [movieData, seriesData] = await Promise.all([
          Promise.all(moviePromises),
          Promise.all(seriesPromises)
        ]);

        setMovies(movieData);
        setSeries(seriesData);
      } catch (error) {
        console.error('Error fetching watchlist titles data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTitles();
  }, [watchlist]);

  const t = useTranslations('MoviesShows');

  const formatRuntime = (runtime: number | null) => {
    if (runtime === null || isNaN(runtime)) return t('noRuntime'); // تحقق من NaN أيضًا
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const containerClasses = 'relative flex flex-row justify-center flex-wrap gap-4 w-full borders rounded-lg p-4 pt-12';
  return (
    <main className='container'>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <h1 className='text-3xl my-6 text-center'>Your Watchlist</h1>

        <section className='flex flex-col gap-16'>
          {movies.length === 0 ? (
            <div className='bg-black-20 animate-pulse h-96 w-full' />
          ) : (
            <div className={containerClasses}>
              <span className='text-lg font-semibold px-6 py-2 bg-red-45 rounded-lg
            absolute top-0 left-0 translate-x-[50%] translate-y-[-50%]'>
                {t('movies')}
              </span>
              {movies.map(item => (
                <div className="relative movie-card group max-w-8 mb-100" key={item.id}>
                  <div className="aspect-w-2 aspect-h-3">
                    <WatchlistButton
                      titleId={item.id.toString()}
                      titleType="movie"
                      style="badge"
                      className="text-white"
                    />
                    <Image
                      src={`https://image.tmdb.org/t/p/w780${item.poster_path}`}
                      alt={item.title}
                      width={200}
                      height={300}
                      className="w-full h-[300px] object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="movie-card-overlay text-center">
                    <h2 className="text-xl font-bold">{item.title}</h2>
                    <Link href={`/browse/movies/title/${item.id}`}>
                      <Button className="mt-4 bg-red-50 text-white hover:bg-red-60">
                        {t('watchMovie')}
                      </Button>
                    </Link>
                    <div className="flex justify-between items-center absolute bottom-2.5 w-full px-4">
                      <span className="text-white bg-black-60 rounded-md px-2 py-1 bg-black-6 flex items-center justify-center gap-1">
                        {item.runtime ? formatRuntime(item.runtime) : t('noRuntime')}
                      </span>
                      <span className="text-white bg-black-60 rounded-md px-2 py-1 bg-black-6 flex items-center justify-center gap-1">
                        <FaStar className="inline-block text-yellow-50" />
                        {(item.vote_average / 2).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {series.length === 0 ? (
            <div className='bg-black-20 animate-pulse h-96 w-full' />
          ) : (
            <div className={containerClasses}>
              <span className='text-lg font-semibold px-6 py-2 bg-red-45 rounded-lg
            absolute top-0 left-0 translate-x-[50%] translate-y-[-50%]'>
                {t('shows')}
              </span>
              {series.map(item => (
                <div className="relative movie-card group max-w-8 mb-100" key={item.id}>
                  <div className="aspect-w-2 aspect-h-3">
                    <WatchlistButton
                      titleId={item.id.toString()}
                      titleType="tv"
                      style="badge"
                      className="text-white"
                    />
                    <Image
                      src={`https://image.tmdb.org/t/p/w780${item.poster_path}`}
                      alt={item.name}
                      width={200}
                      height={300}
                      className="w-full h-[300px] object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="movie-card-overlay text-center">
                    <h2 className="text-xl font-bold">{item.name}</h2>
                    <Link href={`/browse/tv-shows/title/${item.id}`}>
                      <Button className="mt-4 bg-red-50 text-white hover:bg-red-60">
                        {t('watchSeries')}
                      </Button>
                    </Link>
                    <div className="flex justify-between items-center absolute bottom-2.5 w-full px-4">
                      {
                        item.episode_run_time && item.episode_run_time.length > 0 &&
                        <span className="text-white bg-black-60 rounded-md px-2 py-1 bg-black-6 flex items-center justify-center gap-1">
                          {`${item.episode_run_time[0]}m`}
                        </span>
                      }
                      <span className="text-white bg-black-60 rounded-md px-2 py-1 bg-black-6 flex items-center justify-center gap-1">
                        <FaStar className="inline-block text-yellow-50" />
                        {(item.vote_average / 2).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </SignedIn>
    </main>
  );
};

export default Page;
