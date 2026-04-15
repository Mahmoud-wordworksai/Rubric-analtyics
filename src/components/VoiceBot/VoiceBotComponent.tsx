/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
// import CreatableSelect from 'react-select/creatable';
// import "../../styles/voicebot.css";
// import FileVoiceBot from "./FileVoiceBot";
import { Input, Tooltip } from "antd";
// import { isValidNonDecimalNumeric } from "../../utils/helper";

const VoiceBotComponent: React.FC<{ numbersRows: { id: number, name: string, phone: string }[]; setNumbersRows: any }> = ({ numbersRows, setNumbersRows  }) => {
  // const [inputValue, setInputValue] = React.useState('');
  // const [phoneNumbers, setPhoneNumbers] = useState<readonly Option[]>([]);
  // const [filePhoneNumbers, setFilePhoneNumbers] = useState<readonly Option[]>([]);
  // const [responseData, setResponseData] = useState<Record<string, string>>({}); 
  // const [responseMessage, setResponseMessage] = useState(""); 
  // const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // const [errors, setErrors] = useState<any>([]);



  console.log("numbersRows", numbersRows);

  // const handleNumbers = (data: any) => {
  //   setFilePhoneNumbers(data);
  // }

  // const isValidPhoneNumber = (phoneNumber: any) => {
  //   const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
  //   return phoneRegex.test(phoneNumber);
  // }

  //   const debounce = useCallback((delay: number) => {
  //     let handler: any = null;
  //     handler = setTimeout(() => {
  //       if (handler) {
  //         clearTimeout(handler);
  //       }
  //       handleCheckEndPoint();
  //     }, delay);
  //   }, []);

  // const handleAddNumbers = () => {
  //   const phoneNumberArray = [...phoneNumbers, ...filePhoneNumbers].map(option => option.value.trim());

  //   fetch("https://us-central1-wordworks-422908.cloudfunctions.net/add_multi_num_to_sheets-1", { 
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ phone_numbers: phoneNumberArray }), 
  //   })
  //     .then((response) => response.json())
  //     .then(() => {
  //       // setResponseData(data);
  //       setResponseMessage("Phone numbers processed successfully!");
  //       setPhoneNumbers([]); // Reset selection
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //       setResponseMessage("An error occurred while processing the numbers.");
  //     })
  //     .finally(() => {
  //       setIsSubmitting(false);
  //       setResponseMessage("");
  //     });
  // };

  // const handleCheckEndPoint = () => {
  //   if (phoneNumbers.length === 0) {
  //     setResponseMessage("Please add at least one phone number.");
  //     return;
  //   }

  //   setIsSubmitting(true);

  //   fetch("https://us-central1-wordworks-422908.cloudfunctions.net/add_multi_num_to_sheets-1")
  //     .then((response) => response.json())
  //     .then((data) => {
  //       if (data?.status && data.status === "Function is ready!") {
  //         handleAddNumbers();
  //       } else {
  //         debounce(3000);
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //     });
  // };


  // const components = {
  //   DropdownIndicator: null,
  // };

  // interface Option {
  //   readonly label: string;
  //   readonly value: string;
  // }

  // const createOption = (label: string) => ({
  //   label,
  //   value: label,
  // });

  // const handleCreate = () => {
  //   if (!inputValue) return;
  //   // let numbersBySpace = inputValue.split(" ");
  //   const numbersByComma = inputValue.split(",");
  //   // if (numbersBySpace.length !== 1) {
  //   //   const numbers = numbersBySpace.map(number => createOption(number));
  //   //   setPhoneNumbers((prev) => [...prev, ...numbers]);
  //   // } else
  //   console.log("hi =>", numbersByComma);
  //    if (numbersByComma.length !== 1) {
  //     const numbers = numbersByComma.map(number => createOption(number));
  //     setPhoneNumbers((prev) => [...prev, ...numbers]);
  //   } else {
  //     setPhoneNumbers((prev) => [...prev, createOption(inputValue)]);
  //   }
  //   setInputValue('');
  // };

  // const handleKeyDown: KeyboardEventHandler = (event) => {
  //   if (!inputValue) return;
  //   switch (event.key) {
  //     case 'Enter':
  //     case 'Tab':
  //       // let numbersBySpace = inputValue.split(" ");
  //       // eslint-disable-next-line no-case-declarations
  //       const numbersByComma = inputValue.split(",");
  //       // if (numbersBySpace.length !== 1) {
  //       //   const numbers = numbersBySpace.map(number => createOption(number));
  //       //   setPhoneNumbers((prev) => [...prev, ...numbers]);
  //       // } else
  //       console.log("hi =>", numbersByComma);
  //        if (numbersByComma.length !== 1) {
  //         const numbers = numbersByComma.map(number => createOption(number));
  //         setPhoneNumbers((prev) => [...prev, ...numbers]);
  //       } else {
  //         setPhoneNumbers((prev) => [...prev, createOption(inputValue)]);
  //       }
  //       setInputValue('');
  //       event.preventDefault();
  //   }
  // };

  const handleNumbersRows = (id: number, name: string, value: string) => {
    setNumbersRows((prev: any) => {
      return prev.map((data: any) => {
        if (data.id === id) {
          if (name === "name") {
            data.name = value;
          }

          if (name === "phone") {
            // if (!isValidNonDecimalNumeric(value)) {
            //   setErrors((prev: any) => [...prev, { id, msg: "Enter Valid Phone Number!" }]);
            // } else {
              data.phone = value.trim();
            //   setErrors((prev: any) => prev.filter((data: any) => data.id !== id));
            // }
          }
        }
        return data
      })
    })
  }

  const addNumbersRows = () => {
    setNumbersRows((prev: any) => [...prev, { id: prev.length + 1, name: "", phone: "" }])
  }

  const removeNumbersRows = (id: number) => {
    setNumbersRows((prev: any) => prev.filter((data: any) => data.id !== id));
  }

  return (
    <div className="">

       <h5 className="mb-5 text-slate-500 font-medium">Form Data</h5>

      {numbersRows.map(row => {
        return (
          <div key={row.id} className="p-2 flex gap-3 items-center h-max">
            <div className="flex gap-3 w-full max-[768px]:flex-col">
              <Input placeholder="Name" value={row.name} onChange={(e) => handleNumbersRows(row.id, "name", e.target.value)} />
              <Input placeholder="Phone" value={row.phone} onChange={(e) => handleNumbersRows(row.id, "phone", e.target.value)} />
            </div>

            <Tooltip placement="top" title="Remove Number">
            <div className="cursor-pointer rounded-sm" onClick={() => removeNumbersRows(row.id)}>
              <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="#5f6368"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
            </div>
            </Tooltip>
          </div>
        )
      })}
     
      <div className="flex justify-end rounded-sm">
          <Tooltip placement="left" title="Add More Numbers">
            <button className="p-1 rounded-sm border border-slate-300 cursor-pointer" onClick={addNumbersRows}>
            <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="#5f6368"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
            </button>
          </Tooltip>
        </div>
       
        {/* <div className="flex justify-between input-section max-[768px]:items-center max-[768px]:flex-col"> */}
        
            {/* <div>
            <CreatableSelect
                components={components}
                inputValue={inputValue}
                isClearable
                isMulti
                menuIsOpen={true}
                onChange={(newValue) => setPhoneNumbers(newValue)}
                onInputChange={(newValue) => setInputValue(newValue)}
                onKeyDown={handleKeyDown}
                onCreateOption={handleCreate}
                placeholder=".Enter phone numbers..."
                value={phoneNumbers}
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    borderColor: state.isFocused ? 'grey' : '#17a2b8',
                    minHeight: 62,
                    width: '100%',
                  }),
                }}
              />

<p style={{ marginTop: 60 }} >Add multiple numbers separate by comma (,) </p>
            </div> */}

            {/* <div className="p-2 max-[768px]:py-10">OR</div> */}

            {/* <FileVoiceBot isSubmitting={isSubmitting} handleNumbers={handleNumbers} totalNumbers={phoneNumbers.length} />


        </div> */}

        {/* <div className="mt-10 flex flex-col items-center"> */}
        {/* <p className="bg-slate-100 py-3 px-5 rounded-md font-semibold border border-slate-300">Total Added Numbers: {phoneNumbers.length + filePhoneNumbers.length} </p> */}

        {/* <button style={{ marginTop: 20 }} onClick={handleCheckEndPoint} disabled={isSubmitting}>
          {isSubmitting ? (
            <div style={{ display: 'flex', alignItems: "center", gap: 6 }}><div className="loader"></div> Please Wait...</div>
          ) : (
            "Make a call"
          )}
        </button> */}

        {/* <div className="flex gap-2 justify-end p-2 mb-5 mt-2">
            <button onClick={handleCheckEndPoint} disabled={isSubmitting} type="button" className="hover:bg-violet-900 flex gap-2 min-h-10 h-10 justify-center items-center bg-violet-800 w-40 rounded-sm text-white font-medium mr-5" >
            {isSubmitting ? (
                 <>
                 <svg className="animate-spin h-5 w-5 mr-3 ..." viewBox="0 0 24 24"></svg>
                 Processing...
                 </>
              ) : "Make a call"}
            </button>
          </div> */}
        {/* </div> */}

    
        {/* {responseMessage && <p className="bg-red-100 py-3 px-5 rounded-md font-semibold border border-red-300">{responseMessage}</p>} */}

        {/* {Object.keys(responseData).length > 0 && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Phone Number</th>
                  <th>Response</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(responseData).map(([phoneNumber, response]) => (
                  <tr key={phoneNumber}>
                    <td>{phoneNumber}</td>
                    <td>{response}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )} */}
    </div>
  );
};

export default VoiceBotComponent;
