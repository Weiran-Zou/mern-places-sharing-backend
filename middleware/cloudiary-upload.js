const cloudinary = require('cloudinary').v2;
const HttpError = require("../models/http-error");


const CloudinaryUpload = async (req, res, next) => {
    
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    if (!req.file) {
        const error = new HttpError('No file uploaded', 400);
        return next(error);
      }
    
    // // Upload image to Cloudinary using the buffer
    cloudinary.uploader
    .upload_stream({ folder: 'mern-places-sharing' }, (error, result) => {
        if (error) {
            console.log(error);
            const err = new HttpError('Error uploading image to Cloudinary', 500);
            return next(err);
        }
        req.imageUrl = result.secure_url;
        next();
    })
    .end(req.file.buffer); // Send the image buffer to Cloudinary
    
    // try {
    //     // Upload image to Cloudinary
    //     const result = await cloudinary.uploader.upload(req.file.path , {
    //        folder:'mern-places-sharing'
    //     });
    
    //     // Send the Cloudinary URL in the response
    //     res.json({ imageUrl: result.secure_url });
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ error: 'Error uploading image to Cloudinary' });
    // }
}

module.exports = CloudinaryUpload;