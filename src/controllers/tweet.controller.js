import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "content is required to tweet")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    const createdtweet = await Tweet.findById(tweet._id)
    if(!tweet){
        throw new ApiError(500, "Error while tweeting")
    }

    return res.status(200).json(
        new ApiResponse(200, createdtweet,"Tweet created Successfully")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid userId")
    }

    const usertweets = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"tweets",
                localField:"_id",
                foreignField:"owner",
                as:"tweets"
            }
        },
        {
            $addFields:{
                tweets:"$tweets"
            }
        }
    ])

    if(!usertweets){
        throw new ApiError(400,"Incorrect user ID")
    }

    return res.status(200).json(
        new ApiResponse(200, usertweets[0].tweets, "Tweets Fetched Successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweetId while updating")
    }

    const tweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set:{
                content
            }
        },
        {new:true}
    )

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet Updated Successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweetId while deleting")
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet deleted Successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}