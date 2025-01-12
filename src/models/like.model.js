import mongoose,{Schema} from "mongoose";

const likeSchema = new Schema(
    {
        comment:{
            type:Schema.Types.ObjecId,
            ref:"Comment"
        },
        video:{
            type:Schema.Types.ObjecId,
            ref:"Video"
        },
        likedBy:{
            type:Schema.Types.ObjecId,
            ref:"User"
        },
        tweet:{
            type:Schema.Types.ObjecId,
            ref:"Tweet"
        },
    },
    {timestamps:true})

export const Like = mongoose.model("Like",likeSchema)