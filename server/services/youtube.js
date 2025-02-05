const axios = require('axios')

const getVideoTranscript = async (videoId)=>{
    const supdadataApiUrl ='https://api.supadata.ai/v1/youtube/transcript'
    const response = await axios.get(supdadataApiUrl, {
      params: {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        text: 'true'
      },
      headers: {
        'x-api-key': process.env.SUPADATA_API_KEY,
      }
    })
    return response.data.content;
}


const getVideoDetails = async (videoId) =>{
    
    console.log(process.env.GOOGLE_API_KEY)
    const googleApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.GOOGLE_API_KEY}`
    let response;
    try{

       response = await axios.get(googleApiUrl)
    } 
    catch(e){
      console.error(e.message)
    }
    const result = {
        title: response.data.items[0].snippet.title,
        thumbnail: response.data.items[0].snippet.thumbnails.medium.url, 
    }

    return result
     
}

module.exports={getVideoTranscript, getVideoDetails}