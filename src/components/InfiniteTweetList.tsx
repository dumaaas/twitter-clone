import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import { ProfileImage } from "./ProfileImage";
import { VscHeartFilled, VscHeart } from "react-icons/vsc";
import { useSession } from "next-auth/react";
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./LoadingSpinner";

type Tweet = {
    id: string,
    content: string,
    createdAt: Date,
    likeCount: number,
    likedByMe: boolean,
    user: { id: string; image: string | null; name: string | null };
}

type InfiniteTweetListProps = {
    isLoading: boolean,
    isError: boolean,
    hasMore: boolean | undefined,
    fetchNewTweets: () => Promise<unknown>,
    tweets?: Tweet[]
}

export function InfiniteTweetList({ tweets, isError, isLoading, fetchNewTweets, hasMore }: InfiniteTweetListProps) {
    if (isLoading) return <LoadingSpinner />
    if (isError) return <h1>Error...</h1>
    if (tweets == null) return null;

    if (tweets == null || tweets?.length === 0) return <h2 className="my-4 text-center text-2xl text-gray-500">No Tweets</h2>

    return <ul>
        <InfiniteScroll dataLength={tweets.length} next={fetchNewTweets} hasMore={hasMore || false} loader={<LoadingSpinner />}>
            {tweets.map(tweet => {
                return <TweetCard key={tweet.id} {...tweet} />
            })}
        </InfiniteScroll>
    </ul>
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "short" });

function TweetCard({ id, user, content, createdAt, likeCount, likedByMe }: Tweet) {

    const trcpUtils = api.useContext();
    const toggleLike = api.tweet.toggleLike.useMutation({
        onSuccess: ({ addedLike }) => {
            const updateData: Parameters<typeof trcpUtils.tweet.infiniteFeed.setInfiniteData>[1] = (oldData) => {
                if (oldData == null) return;
                const countModifier = addedLike ? 1 : -1

                return {
                    ...oldData,
                    pages: oldData.pages.map(page => {
                        return {
                            ...page,
                            tweets: page.tweets.map(tweet => {
                                if (tweet.id === id) {
                                    return {
                                        ...tweet,
                                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/restrict-plus-operands
                                        likeCount: tweet.likeCount + countModifier,
                                        likedByMe: addedLike
                                    }
                                }
                                return tweet;
                            })
                        }
                    })
                }
            }

            trcpUtils.tweet.infiniteFeed.setInfiniteData({}, updateData);
            trcpUtils.tweet.infiniteFeed.setInfiniteData({onlyFollowing: true}, updateData);
            trcpUtils.tweet.infiniteProfileFeed.setInfiniteData({userId: user.id}, updateData);

        }
    });

    function handleTogglelike() {
        toggleLike.mutate({ id })
    }
    return <li className="flex gap-4 border-b px-4 py-4 ">
        <Link href={`/profiles/${user.id}`}>
            <ProfileImage src={user.image} />
        </Link>
        <div className="flex flex-grow flex-col">
            <div className="flex gap-1">
                <Link href={`/profiles/${user.id}`} className="font-bold hover:underline focus-visible:underline outline-none">
                    {user.name}
                </Link>
                <span className="text-gray-500">
                    -
                </span>
                <span className="text-gray-500">
                    {dateTimeFormatter.format(createdAt)}
                </span>
            </div>
            <p className="whitespace-pre-wrap">
                {content}
            </p>
            <HeartButton onClick={handleTogglelike} isLoading={toggleLike.isLoading} likedByMe={likedByMe} likeCount={likeCount} />
        </div>
    </li>
}

type HeartButtonProps = {
    onClick: () => void,
    likedByMe: boolean,
    likeCount: number,
    isLoading: boolean,
}

function HeartButton({ isLoading, onClick, likedByMe, likeCount }: HeartButtonProps) {
    const session = useSession();
    const HeartIcon = likedByMe ? VscHeartFilled : VscHeart

    if (session.status !== "authenticated") {
        return <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
            <HeartIcon />
            <span>
                {likeCount}
            </span>
        </div>
    }
    return <button disabled={isLoading} onClick={onClick} className={`group items-center gap-1 self-start flex transition-colors duration-200 ${likedByMe ? 'text-red-500' : 'text-gray-500 hover:text-red-500 focus-visible:text-red-500'}`}>
        <IconHoverEffect red>
            <HeartIcon className={`transition-colors duration-200 ${likedByMe ? "fill-red-500" : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"}`} />
        </IconHoverEffect>
        <span>{likeCount}</span>
    </button>
}