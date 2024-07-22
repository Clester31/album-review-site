export const getTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    const timestamp = `${day}-${month}-${year} ${hour}:${minute < 10 ? `0${minute}` : minute}:${second < 10 ? `0${second}` : second}`;
    return timestamp;
}