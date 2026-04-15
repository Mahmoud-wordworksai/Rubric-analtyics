/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import * as XLSX from 'xlsx';
import Papa from 'papaparse';
// import axios from 'axios';
// import { useState } from 'react';
import readXlsxFile from 'read-excel-file';
import IconCsv from './IconCsv';
import { useState } from 'react';


function FileVoiceBotv3({ allFiles, setAllFiles }: any) {

  // console.log("allFiles", allFiles);
  const [tempFile, setTempFile] = useState<any>(null);

  const removeFile = (id: any) => {
    setTempFile(null);
    setAllFiles(null);
  }

  function readableFileSize(attachmentSize: any) {
    const DEFAULT_SIZE = 0;
    const fileSize = attachmentSize ?? DEFAULT_SIZE;
  
    if (!fileSize) {
      return `${DEFAULT_SIZE} kb`;
    }
  
    const sizeInKb = fileSize / 1024;
  
    if (sizeInKb > 1024) {
      return `${(sizeInKb / 1024).toFixed(2)} mb`;
    } else {
      return `${sizeInKb.toFixed(2)} kb`;
    }
  }

  

  const handleFileChange = async (e: any) => {
    const file = e.target.files[0];

    if (!file) {
      e.target!.value = null;
      return;
    }

    setAllFiles(file);

    const validExtensions = ['xls', 'xlsx', 'csv']; // Supported extensions
    const extension = file.name.split('.').pop().toLowerCase(); // Extract the file extension

    if (!validExtensions.includes(extension)) {
      alert(`Invalid file type. Please upload a file with one of the following extensions: ${validExtensions.join(', ')}`);
      e.target!.value = null;
      return;
    }

    if (extension === 'csv') {
      Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().replace(/ /g, "_"),
      complete: (results) => {
        const rows = results.data;
        if (rows.length === 0) {
        e.target!.value = null;
        throw new Error("Empty file, No data found! Check Required Columns");
        }

        const firstRow = rows[0];
        if (firstRow) {
        const headerArray = Object.keys(firstRow);

        if (!headerArray.includes("customer_name") && !headerArray.includes("customer_name") && !headerArray.includes("customer_name")) {
          alert("No data found!, Check Required Column (customer_name)");
          e.target!.value = null;
          throw new Error("No data found!, Check Required Column (customer_name)");
        }

        if (!headerArray.includes("emi_amount") && !headerArray.includes("emi_amount") && !headerArray.includes("emi_amount")) {
          alert("No data found!, Check Required Column (emi_amount)");
          e.target!.value = null;
          throw new Error("No data found!, Check Required Column (emi_amount)");
        }

        if (!headerArray.includes("phone_number") && !headerArray.includes("phone_number") && !headerArray.includes("phone_number")) {
          alert("No data found!, Check Required Column (phone_number)");
          e.target!.value = null;
          throw new Error("No data found!, Check Required Column (phone_number)");
        }

        if (!headerArray.includes("payment_date") && !headerArray.includes("payment_date") && !headerArray.includes("payment_date")) {
          alert("No data found!, Check Required Column (payment_date)");
          e.target!.value = null;
          throw new Error("No data found!, Check Required Column (payment_date)");
        }

        setTempFile({ 
          id: 1,
          name: file.name, 
          size: readableFileSize(file.size),
          file: new Blob([Papa.unparse(rows)], { type: `text/${extension}` }),
          count: rows.length,
        });
        }
        e.target!.value = null;
      },
      error: (err) => {
        e.target!.value = null;
        console.error('Error parsing CSV:', err);
      },
      });
    } else {
      // Handle XLS and XLSX files

      readXlsxFile(file).then((rows) => {
      if (rows.length <= 1) {
        e.target!.value = null;
        throw new Error("Empty file, No data found! Check Required Columns");
      }

      const headerArray = (rows[0] as string[]).map((header) => header.toLowerCase().replace(/ /g, "_"));

      if (!headerArray.includes("customer_name")) {
        alert("No data found!, Check Required Column (customer_name)");
        e.target!.value = null;
        throw new Error("No data found!, Check Required Column (customer_name)");
      }

      if (!headerArray.includes("emi_amount")) {
        alert("No data found!, Check Required Column (emi_amount)");
        e.target!.value = null;
        throw new Error("No data found!, Check Required Column (emi_amount)");
      }

      if (!headerArray.includes("phone_number")) {
        alert("No data found!, Check Required Column (phone_number)");
        e.target!.value = null;
        throw new Error("No data found!, Check Required Column (phone_number)");
      }

      if (!headerArray.includes("payment_date")) {
        alert("No data found!, Check Required Column (payment_date)");
        e.target!.value = null;
        throw new Error("No data found!, Check Required Column (payment_date)");
      }

      const dataRows = rows.slice(1); // Exclude header row
      setTempFile({
        id: 1,
        name: file.name,
        size: readableFileSize(file.size),
        file: new Blob([JSON.stringify(dataRows)], { type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` }),
        count: dataRows.length,
      });
      e.target!.value = null;
      }).catch((err) => {
      e.target!.value = null;
      console.error('Error reading Excel file:', err);
      });
    }
  };

  return (
    <div className='flex flex-col gap-8 w-full'>
    
    <h5 className='text-slate-500 font-medium' >Files Data</h5>

    <div className="flex items-center gap-4">
      <a
        href="/sample-voicebot-data.csv"
        download="sample-voicebot-data.csv"
        className="text-blue-500 underline"
      >
        Download Sample File
      </a>
      <p className="text-sm text-gray-500">
        Sample file includes required columns: (customer_name, emi_amount, phone_number, payment_date)
        Make sure your Mobile column is of text data type, or if it is number make sure decimal place are up to 0. To avoid exponential values which excel takes by default.
      </p>
    </div>
    
<div className="flex items-center justify-center w-full">
    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
        </svg>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Allowed only XL, XLSX, CSV files * <br />
          Required Columns (name, phone_number, email) * <br />
          Make sure your phone_number column is of text data type, or if it is number make sure decimal place are up to 0. To avoid exponential values which excel takes by default.
        </p>
      </div>
      <input accept=".csv, .xls, .xlsx" id="dropzone-file" onChange={handleFileChange} type="file" className="hidden" />
    </label>
</div> 

     
     <div className='flex flex-col gap-5'>

        {/* {[tempFile].map(({ id,  name, size, count }: any) => ( */}
        {tempFile && (
          <div className='file-upload-parent-wuy3weh p-2 border border-slate-300 rounded-md flex items-center gap-2 relative'>
           <IconCsv />
            
            <div className='flex flex-col'>
              <span>{tempFile.name}</span>
              <div className='flex items-center gap-5'>
                <span className='text-sm text-slate-700'>{tempFile.size}</span>
                <span className='text-sm text-slate-700'>{tempFile.count} records</span>
              </div>
            </div>

            <div onClick={() => {}} className='remove-file-upload-wuy3weh absolute top-0 right-0 cursor-pointer'>
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="22" height="22" viewBox="0 0 64 64">
            <radialGradient id="HT0faz4O4Vh0F3ae~ONMba_119734_gr1" cx="33" cy="32" r="28.609" gradientUnits="userSpaceOnUse" spreadMethod="reflect"><stop offset="0" stopColor="#efdcb1"></stop><stop offset="0" stopColor="#f2e0bb"></stop><stop offset=".011" stopColor="#f2e0bc"></stop><stop offset=".362" stopColor="#f9edd2"></stop><stop offset=".699" stopColor="#fef4df"></stop><stop offset="1" stopColor="#fff7e4"></stop></radialGradient><path fill="url(#HT0faz4O4Vh0F3ae~ONMba_119734_gr1)" d="M53,34h5.241c2.868,0,5.442-2.082,5.731-4.936C64.303,25.789,61.711,23,58.5,23l-12.33,0 c-1.624,0-3.081-1.216-3.165-2.839C42.914,18.431,44.29,17,46,17h2.241c2.868,0,5.442-2.082,5.731-4.936 C54.303,8.789,51.711,6,48.5,6l-38,0C7.462,6,5,8.462,5,11.5v0c0,3.038,2.462,5.5,5.5,5.5H14c1.105,0,2,0.895,2,2v0 c0,1.105-0.895,2-2,2l-7.288,0c-2.347,0-4.453,1.704-4.689,4.038C1.752,27.718,3.873,30,6.5,30l6.33,0 c1.624,0,3.081,1.216,3.165,2.839C16.086,34.569,14.71,36,13,36H9.712c-2.347,0-4.453,1.704-4.689,4.038 C4.753,42.718,6.873,45,9.5,45h4.393c0.996,0,1.92,0.681,2.08,1.664C16.176,47.917,15.215,49,14,49H9.712 c-2.347,0-4.453,1.704-4.689,4.038C4.752,55.718,6.873,58,9.5,58h22c0.086,0,0.166-0.021,0.25-0.025C31.834,57.982,31.914,58,32,58 l8.386,0c1.67,0,3.195-1.122,3.537-2.757C44.392,52.998,42.668,51,40.5,51h-2.393c-0.996,0-1.92-0.681-2.08-1.664 C35.824,48.083,36.785,47,38,47l18.288,0c2.347,0,4.453-1.704,4.689-4.039C61.247,40.282,59.127,38,56.5,38h-3.393 c-0.996,0-1.92-0.681-2.08-1.664C50.824,35.083,51.785,34,53,34z"></path><linearGradient id="HT0faz4O4Vh0F3ae~ONMbb_119734_gr2" x1="31.996" x2="31.996" y1="52.998" y2="11.001" gradientUnits="userSpaceOnUse" spreadMethod="reflect"><stop offset="0" stopColor="#ff634d"></stop><stop offset=".204" stopColor="#fe6464"></stop><stop offset=".521" stopColor="#fc6581"></stop><stop offset=".794" stopColor="#fa6694"></stop><stop offset=".989" stopColor="#fa669a"></stop><stop offset="1" stopColor="#fa669a"></stop></linearGradient><path fill="url(#HT0faz4O4Vh0F3ae~ONMbb_119734_gr2)" d="M51.933,12.058l0.003,0.003c1.413,1.412,1.414,3.702,0.001,5.114L17.167,51.939 c-1.412,1.412-3.701,1.412-5.112,0l0,0c-1.412-1.412-1.412-3.701,0-5.113L46.821,12.06C48.233,10.648,50.521,10.648,51.933,12.058z"></path><linearGradient id="HT0faz4O4Vh0F3ae~ONMbc_119734_gr3" x1="31.994" x2="31.994" y1="53.003" y2="10.997" gradientUnits="userSpaceOnUse" spreadMethod="reflect"><stop offset="0" stopColor="#ff634d"></stop><stop offset=".204" stopColor="#fe6464"></stop><stop offset=".521" stopColor="#fc6581"></stop><stop offset=".794" stopColor="#fa6694"></stop><stop offset=".989" stopColor="#fa669a"></stop><stop offset="1" stopColor="#fa669a"></stop></linearGradient><path fill="url(#HT0faz4O4Vh0F3ae~ONMbc_119734_gr3)" d="M51.933,51.944L51.933,51.944c-1.412,1.412-3.701,1.412-5.113,0L12.054,17.168 c-1.411-1.412-1.411-3.701,0-5.112l0,0c1.412-1.412,3.701-1.412,5.113,0l34.766,34.776C53.345,48.244,53.345,50.533,51.933,51.944z"></path>
            </svg>
            </div>
          </div>
          )}
        {/* // ))} */}
     </div>

    </div>
  );
}

export default FileVoiceBotv3;