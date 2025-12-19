import axios from "axios";

const getAxiosInstance = () => {
  const getAxios = axios.create({
 // baseURL: "http://localhost:7000/api/",
 baseURL:"https://api.bilimbebrandactivations.com/api/"
  });
  return getAxios;
};
const useAxios = () => {
  const useAxiosData = getAxiosInstance();
  return useAxiosData;
};

export default useAxios;