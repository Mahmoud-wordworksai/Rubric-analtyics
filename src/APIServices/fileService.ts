import axiosInstance from '@/lib/axios';
import { downloadCsvAndStore } from "@/utils/helper";

const FILE_SERVICE_BASE_URL = 'https://api-service.wordworksai.me/v1/api';

const UploadCSV = async (file: File, bucket: string, folder: string) => {
  // Create FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  formData.append('folder', folder);

  try {
    const response = await axiosInstance.post(`${FILE_SERVICE_BASE_URL}/buckets/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('File upload successful:', response.data);
    return response.data;

  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

const ReadCSV = async (bucket: string, folder: string, fileName: string) => {
  try {
    const csvContent = await downloadCsvAndStore(`${FILE_SERVICE_BASE_URL}/buckets/${bucket}/${folder}/${fileName}`);
    console.log("Parsed CSV Data", csvContent);
    return csvContent;
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}

const FileService = {
  UploadCSV,
  ReadCSV
}

export default FileService;
