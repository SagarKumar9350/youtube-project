
import mongoose,{isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadonCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as:"videos"
            }
        },{
            $addFields:{
                videos:"$videos"
            }
        }
    ])

    if(!user){
        throw new ApiError(404, "Incorrect user ID")
    }

    return res.status(200).json(
        new ApiResponse(200,user[0].videos,"Fetched all videos")
    )

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title || !description){
        throw new ApiError(400, "title and description is required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(400,"Video file and thumbnail is required")
    }

    const videoFile = await uploadonCloudinary(videoLocalPath)
    const thumbnail = await uploadonCloudinary(thumbnailLocalPath)

    if(!videoFile || !thumbnail){
        throw new ApiError(400,"Video file and thumbnail is required")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user?._id
    })

    const uploadedVideo = await Video.findById(video._id)
    if(!uploadedVideo){
        throw new ApiError(500,"Error in uploading video")
    }

    return res.status(200).json(
        new ApiResponse(200,uploadedVideo,"Video uploaded Successfully")
    )

})

//pending incresing the views and inserting video in the watchHistory of user
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        return new ApiError(400,"Invalid videoId");
    }

    // if(!videoId?.trim()){
    //     throw new ApiError(400,"VideoId is missing")
    // }

    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first: "$owner"
                }
            }
        }
    ])

    if(!video){
        throw new ApiError(404, "Cannot find video");
    }

    return res.status(200).json(
        new ApiResponse(200, video[0], "Video fetched Successfully")
    )

})

const updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description

    if(!isValidObjectId(videoId)){
        return new ApiError(400,"Invalid videoId");
    }
    const {title,description} = req.body

    if(!title || !description){
        throw new ApiError(400, "Missing video fields")
    }

    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                title,
                description
            }
        },
        {new:true}
    )

    return res.status(200).json(
        new ApiResponse(200,video,"Video details updated Successfully")
    )

})

const updateThumbnail = asyncHandler(async(req,res) =>{
    const thumbnailLocalPath = req.files?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400, "thumbnail file is missing")
    }

    const thumbnail = await uploadonCloudinary(thumbnailLocalPath)

    if(!thumbnail.url){
        throw new ApiError(500, "Error while updating thumbnail file")
    }

    const video = await Video.findByIdAndUpdate(req.params?.videoId,
        {
            $set:{
                thumbnail: thumbnail.url
            }
        },
        {new:true}
    )


    return res.status(200).json(
        new ApiResponse(200, video ,"Thumbnail updated Successfully")
    )
})

//need to check while testing api
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        return new ApiError(400,"Invalid videoId");
    }

     const video = await Video.findByIdAndDelete(videoId);

     return res.status(200).json(
        new ApiResponse(200,video,"Video deleted Successfully")
     )
})

//pending
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        return new ApiError(400,"Invalid videoId")
    }

    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                isPublished:{
                    $cond:{
                        if:{$eq: {"isPublished":true} },
                        then:false,
                        else:true
                    }
                }
            }
            
        },
        {new:true}
    )

    return res.status(200).json(
        new ApiResponse(200,video, "Status changed Successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideoDetails,
    updateThumbnail,
    deleteVideo,
    togglePublishStatus
}