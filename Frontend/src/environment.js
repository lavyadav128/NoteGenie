let IS_PROD = true;
const server = IS_PROD ?
    "https://notegenie-ao3j.onrender.com" :
    //"https://notes-szjj.onrender.com":
    "http://localhost:5000"

  
export default server;