/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from '@/lib/axios';

const DB_SERVICE_BASE_URL = 'https://api-service.wordworksai.me/v1/api';

async function SaveInfo(collection: string, data: any, init: string = 'no') {
  try {
    const url = `${DB_SERVICE_BASE_URL}/info/${collection}?init=${init}`;

    const response = await axiosInstance.post(url, data);

    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

async function UpdateInfo(collection: string, id: string, data: any) {
  try {
    const url = `${DB_SERVICE_BASE_URL}/info/${collection}/${id}`;

    const response = await axiosInstance.put(url, data);

    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

async function ReadInfo(collection: string, id: string) {
  try {
    const url = `${DB_SERVICE_BASE_URL}/info/${collection}/${id}`;

    const response = await axiosInstance.get(url);

    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

async function ReadInfoAll(collection: string, pagination: any) {
  console.log("pagination in DB", pagination);
  try {
    const url = `${DB_SERVICE_BASE_URL}/info/${collection}?page=${pagination.page}&limit=${pagination.limit}&sortBy=desc`;

    const response = await axiosInstance.get(url);

    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

async function CallTrigger(data: any) {
  try {
    const url = `${DB_SERVICE_BASE_URL}/voicebot-call`;

    const response = await axiosInstance.post(url, data);

    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

async function ReadProcessed(orderId: string, subId: string, pagination: any) {
  console.log("pagination in DB", pagination);
  try {
    const url = `${DB_SERVICE_BASE_URL}/info/processed/c4/${orderId}/${subId}?page=${pagination.page}&limit=${pagination.limit}`;

    const response = await axiosInstance.get(url);

    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

async function ReadError(orderId: string, subId: string, pagination: any) {
  console.log("pagination in DB", pagination);
  try {
    const url = `${DB_SERVICE_BASE_URL}/info/error/c4/${orderId}/${subId}?page=${pagination.page}&limit=${pagination.limit}`;

    const response = await axiosInstance.get(url);

    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

async function orderStatus(orderId: string) {
  try {
    const url = `${DB_SERVICE_BASE_URL}/info/status/${orderId}`;

    const response = await axiosInstance.get(url);

    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

const DBService = {
  SaveInfo,
  ReadInfo,
  UpdateInfo,
  ReadInfoAll,
  CallTrigger,
  ReadProcessed,
  orderStatus,
  ReadError,
}

export default DBService;
