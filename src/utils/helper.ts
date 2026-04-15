import axiosInstance from '@/lib/axios';
import Papa from 'papaparse';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const isValidNonDecimalNumeric = (value: any) => {
    // Check if the value is null or undefined
    if (value === null || value === undefined) {
        return false;
    }

    // Check if the value is a boolean (should not be considered as numeric)
    if (typeof value === 'boolean') {
        return false;
    }

    // Check if the value is a number and is an integer
    if (typeof value === 'number') {
        return Number.isInteger(value); // Only valid for integers
    }

    // Check if the value is a string that can be parsed into an integer
    if (typeof value === 'string') {
        // Trim spaces and check for empty string
        value = value.trim();
        if (value === '') {
            return false; // Empty strings are not valid numbers
        }

        // Check if the string represents a valid integer
        const parsed = parseFloat(value); // Parse the value
        if (Number.isInteger(parsed) && isFinite(parsed)) {
            return true;
        }
        return false;
    }

    // For all other types (objects, arrays, etc.), return false
    return false;
}

export const downloadCsvAndStore = async (url: string) => {
  try {
    // Fetch the CSV file as a blob
    const response = await axiosInstance.get(url, {
      responseType: 'blob', // Ensure the response is a Blob (binary data)
    });

    // Store the CSV data as a Blob
    const csvBlob = response.data;

    // Convert the Blob to text for further processing
    const csvText = await csvBlob.text();

    console.log('CSV Text:', csvText); // The CSV content is now stored in csvText

    // Optionally, parse the CSV text into an array (using PapaParse, for example)
    const parsedData = Papa.parse(csvText, { header: true }).data;
    // console.log('Parsed CSV Data:', parsedData);

    return parsedData; // Return or use the CSV text as needed

  } catch (error) {
    console.error('Error downloading the CSV file:', error);
  }
}

export const getExtractOrder = (order: any) => {
  const findOutCome = order.items.find((data: any) => data?.VirtualAgentProviderData?.IntentDisplayName === 'Yes');

  const findData = order.items.find((data: any) => data?.VirtualAgentProviderData?.IntentDisplayName === 'day_scheduling' && data?.VirtualAgentProviderData?.Parameters['date-time']);

  let outCome = 'No';
  if (findOutCome) {
    outCome = 'Yes';
  }

  let futureDate = '-';
  if (findData) {
    const futureDateRaw = findData?.VirtualAgentProviderData?.Parameters['date-time'];
    futureDate = `${futureDateRaw?.day}-${futureDateRaw?.month}-${futureDateRaw?.year}`;
  }

  const name = order.items[0]?.VirtualAgentProviderData?.Parameters['name'];
  const number = order.items[0]?.VirtualAgentProviderData?.Parameters['number'];

  return { name, number, outCome, futureDate }
}