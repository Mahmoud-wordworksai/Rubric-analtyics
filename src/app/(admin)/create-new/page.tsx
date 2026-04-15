"use client"
import { useState, Suspense } from "react";
import axiosInstance from "@/lib/axios";
import { Input, Select, Switch, Button, Checkbox } from "antd";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import { Oval } from "react-loader-spinner";
import { v4 as uuidv4 } from 'uuid';
import DatasheetDropdown from "@/components/DataSheetDropdown";
import { API_BASE_URL, API_KEY } from "@/constants";
import { useRoomAPI } from "@/hooks/useRoomAPI";

interface DynamicFilter {
  id: string;
  key: string;
  operator: string;
  values: string[];
}

const NewSalesAgentInfov2 = () => {
  const { appendRoomParam, navigateTo } = useRoomAPI();
  const [projectName, setProjectName] = useState<string>("");
  const [orders, setOders] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [dndCheck, setDndCheck] = useState<boolean>(false);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const [sms, setSms] = useState<boolean>(false);
  const [emailType, setEmailType] = useState<string>("static");
  const [tag, setTag] = useState<string>("test");
  const [datasheetId, setDatasheetId] = useState<string>("");
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('default');
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilter[]>([]);
  const [disableDefaultFilter, setDisableDefaultFilter] = useState<boolean>(false);
  const [filterLogic, setFilterLogic] = useState<string>("and");

  const createExecution = async () => {
    console.log("API Work");

  //  if (!projectName) {
  //     alert("Error!, Provide Project Name");
  //     // setLoading(false);
  //     return;
  //   }

      if (!selectedTemplateName) {
      alert("Error!, Provide Template");
      // setLoading(false);
      return;
    }

     if (!datasheetId) {
      alert("Error!, Provide datasheet");
      // setLoading(false);
      return;
    }

    // const validateNumber = (num: string) => {
    //   const parsedNum = parseInt(num, 10);
    //   return !isNaN(parsedNum) && parsedNum > 0;
    // };

    // if (!validateNumber(noOfAnsweredCalls)) {
    //   alert("Error!, No of answered calls must be a positive number");
    //   // setLoading(false);
    //   return;
    // }


    setLoading(true);

    const uniqueId = uuidv4().replace(/-/g, '').slice(0, 4);

    // Build dynamic filters for MongoDB format
    const buildMongoFilters = () => {
      const filterArray: Record<string, Record<string, string[] | boolean | string>>[] = [];

      // Add dynamic filters with uppercase key
      dynamicFilters.forEach(filter => {
        if (filter.key && (filter.values.length > 0 || filter.operator === 'exists' || filter.operator === 'not_exists')) {
          const filterKey = filter.key.toUpperCase();
          if (filter.operator === 'eq') {
            filterArray.push({ [filterKey]: { $in: filter.values } });
          } else if (filter.operator === 'nq') {
            filterArray.push({ [filterKey]: { $nin: filter.values } });
          } else if (filter.operator === 'exists') {
            filterArray.push({ [filterKey]: { $exists: true } });
          } else if (filter.operator === 'not_exists') {
            filterArray.push({ [filterKey]: { $exists: false } });
          } else if (filter.operator === 'regex') {
            filterArray.push({ [filterKey]: { $regex: filter.values[0], $options: 'i' } });
          }
        }
      });

      if (filterArray.length === 0) return null;
      if (filterArray.length === 1) return filterArray[0];

      // Wrap in $and or $or based on filterLogic
      return filterLogic === 'or' ? { $or: filterArray } : { $and: filterArray };
    };

    try {
      const results = await axiosInstance.post(
        appendRoomParam(`${API_BASE_URL}/csv-execution-v2?api_key=${API_KEY}`),
        {
          data: JSON.stringify({
            datasheet_id: datasheetId,
            run_filter: buildMongoFilters(),
            disable_default_filter: disableDefaultFilter ? "yes" : "no",
            selected: selectedTemplateName,
            project_name: `${uniqueId}-${projectName}`?.toLowerCase(),
            tag: tag,
            dnd_check: dndCheck,
            is_email_sent: isEmailSent,
            email_type: emailType,
            sms: sms,
          })
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      // fetchResults();
      console.log("results", results.data);
      // if (results.data.status === "success") {
      //   await axiosInstance.post(
      //     `${API_BASE_URL}/csv-queuecalls?api_key=${API_KEY}`,
      //     {
      //       execution_ids: results.data.results.map((data: any) => data.execution_id),
      //     }
      //   );
      // }
      alert("Project created successfully");
      setOders(true);
      goToAllOrders();
    } catch (error) {
      console.error("Error starting execution:", error);
      alert(`Error starting execution: ${error}`);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // const handleChangeRunFilter = (value: string[]) => {
  //   setRunFilter(value.map(data => {
  //     if (data === "blanks") {
  //       return "";
  //     }
  //     return data;
  //   }));
  // };

  const optionsFilterType = [
    { label: 'Equal to ($in)', value: 'eq' },
    { label: 'Not Equal to ($nin)', value: 'nq' },
    { label: 'Exists', value: 'exists' },
    { label: 'Not Exists', value: 'not_exists' },
    { label: 'Regex', value: 'regex' },
  ];

  const addDynamicFilter = () => {
    setDynamicFilters([
      ...dynamicFilters,
      { id: uuidv4(), key: '', operator: 'eq', values: [] }
    ]);
  };

  const removeDynamicFilter = (id: string) => {
    setDynamicFilters(dynamicFilters.filter(f => f.id !== id));
  };

  const updateDynamicFilter = (id: string, field: keyof DynamicFilter, value: string | string[]) => {
    setDynamicFilters(dynamicFilters.map(f =>
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const goToAllOrders = () => {
    navigateTo("/projects");
  };

  // Template list loading commented out as dropdown is not currently in use
  // useEffect(() => {
  //   const loadTemplateList = async () => {
  //     try {
  //       const response = await fetch(`${API_BASE_URL}/prompt-templates?basic=true&api_key=${API_KEY}`);
  //       if (!response.ok) throw new Error('Failed to fetch template list');
  //       const data = await response.json();

  //       if (data.status === 'success' && data.templates) {
  //         setTemplateList(data.templates);

  //         if (!selectedTemplateName && data.templates.some((t: TemplateListItem) => t.name === 'main')) {
  //           setSelectedTemplateName('main');
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Failed to load template list:', error);
  //     }
  //   };

  //   loadTemplateList();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])


  return (
    <>
          <>
            <div className="mt-5 pb-10">
              <div className="flex items-center gap-3">
              <FiArrowLeft
                size={28}
                className="cursor-pointer text-[#263978]"
                onClick={() => navigateTo("/projects")}
              />
              <h3 className="text-3xl font-black text-[#263978] max-[768px]:text-2xl">
                Create
              </h3>
              </div>
            </div>

            <div className="flex flex-col gap-5 pb-20 p-6 rounded-xl">

              {/* Tag Field */}
              <div className="flex gap-6 justify-between items-center w-full max-[768px]:flex-col max-[768px]:items-start py-4">
                <label className="w-1/4 max-[768px]:w-full text-[#263978] font-semibold text-base">
                  Tag <span className="text-red-500">*</span>
                </label>
                <Select
                  value={tag}
                  className="w-3/4 max-[768px]:w-full select-modern"
                  size="large"
                  onChange={(value) => setTag(value)}
                  options={[
                    { value: 'test', label: 'Test' },
                    { value: 'production', label: 'Production' }
                  ]}
                  variant="borderless"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200" />

              {/* Select Template Field */}
              <div className="flex gap-6 justify-between items-center w-full max-[768px]:flex-col max-[768px]:items-start py-4">
                <label className="w-1/4 max-[768px]:w-full text-[#263978] font-semibold text-base">
                  Template <span className="text-red-500">*</span>
                </label>
                {/* <Select
                  showSearch
                  placeholder="Select a Template"
                  optionFilterProp="children"
                  onChange={(value) => setSelectedTemplateName(value)}
                  value={selectedTemplateName}
                  className="w-3/4 max-[768px]:w-full select-modern"
                  size="large"
                  variant="borderless"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  filterOption={(input, option) =>
                    (option?.children?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {templateList.map((template) => (
                    <Select.Option key={template._id.$oid} value={template.name}>
                      <span>
                        {template.name}
                        {template.name === 'main' && <Tag color="blue" style={{ marginLeft: 8 }}>DEFAULT</Tag>}
                      </span>
                    </Select.Option>
                  ))}
                </Select> */}
                 <Input
                  placeholder="Enter Template"
                  className="w-3/4 max-[768px]:w-full"
                  size="large"
                  value={selectedTemplateName}
                  onChange={(e) => setSelectedTemplateName(e.target.value)}
                  variant="borderless"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    padding: '8px 16px'
                  }}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200" />

              {/* Files Data Field */}
              <div className="flex gap-6 justify-between items-center w-full max-[768px]:flex-col max-[768px]:items-start py-4">
                <label className="w-1/4 max-[768px]:w-full text-[#263978] font-semibold text-base">
                  Files Data <span className="text-red-500">*</span>
                </label>
                <div className="w-3/4 max-[768px]:w-full">
                  <DatasheetDropdown value={datasheetId} onChange={setDatasheetId} />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200" />

              {/* Description Field */}
              <div className="flex gap-6 justify-between items-center w-full max-[768px]:flex-col max-[768px]:items-start py-4">
                <label className="w-1/4 max-[768px]:w-full text-[#263978] font-semibold text-base">
                  Description
                </label>
                <Input
                  placeholder="Enter project description"
                  className="w-3/4 max-[768px]:w-full"
                  size="large"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  variant="borderless"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    padding: '8px 16px'
                  }}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200" />

                {/* Dynamic Filters Section */}
                <div className="flex gap-6 justify-between w-full max-[768px]:flex-col max-[768px]:w-full py-4">
                  <div className="w-1/4 max-[768px]:w-full">
                    <label className="text-[#263978] font-semibold text-base">
                      Filters
                    </label>
                    <p className="text-slate-500 text-sm mt-1">Add dynamic filters</p>
                  </div>
                  <div className="w-3/4 max-[768px]:w-full flex flex-col gap-3">
                    {/* Filter Logic Selector */}
                    {dynamicFilters.length > 1 && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-600 font-medium text-sm">Combine filters with:</span>
                        <Select
                          value={filterLogic}
                          onChange={setFilterLogic}
                          size="middle"
                          style={{ width: 100 }}
                          options={[
                            { label: 'AND', value: 'and' },
                            { label: 'OR', value: 'or' },
                          ]}
                        />
                        <span className="text-slate-500 text-xs">
                          {filterLogic === 'and' ? '(All conditions must match)' : '(Any condition can match)'}
                        </span>
                      </div>
                    )}
                    {dynamicFilters.map((filter) => (
                      <div key={filter.id} className="flex gap-2 items-start p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex gap-2 items-center flex-wrap">
                            <Input
                              placeholder="Field key (e.g., disposition)"
                              value={filter.key}
                              onChange={(e) => updateDynamicFilter(filter.id, 'key', e.target.value)}
                              size="large"
                              style={{ width: 200, backgroundColor: '#f8fafc', borderRadius: '6px' }}
                            />
                            <Select
                              value={filter.operator}
                              onChange={(value) => updateDynamicFilter(filter.id, 'operator', value)}
                              options={optionsFilterType}
                              size="large"
                              style={{ width: 160, backgroundColor: '#f8fafc', borderRadius: '6px' }}
                            />
                          </div>
                          {filter.operator !== 'exists' && filter.operator !== 'not_exists' && (
                            <Select
                              mode="tags"
                              className="select-modern"
                              style={{ width: '100%', backgroundColor: '#f8fafc', borderRadius: '6px' }}
                              size="large"
                              placeholder={filter.operator === 'regex' ? "Enter regex pattern" : "Enter values (press Enter to add)"}
                              value={filter.values.map(v => v === '' ? '__BLANK__' : v)}
                              onChange={(values) => updateDynamicFilter(filter.id, 'values', values.map((v: string) => v === '__BLANK__' ? '' : v))}
                              variant="borderless"
                              tokenSeparators={[',']}
                              options={[{ label: '(Blanks)', value: '__BLANK__' }]}
                            />
                          )}
                        </div>
                        <Button
                          type="text"
                          danger
                          icon={<FiTrash2 size={18} />}
                          onClick={() => removeDynamicFilter(filter.id)}
                          className="mt-1"
                        />
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      icon={<FiPlus />}
                      onClick={addDynamicFilter}
                      className="w-full h-12"
                      style={{ borderColor: '#263978', color: '#263978' }}
                    >
                      Add Filter
                    </Button>
                  </div>
                </div>

              {/* Divider */}
              <div className="border-t border-slate-200" />

              {/* Settings Field */}
              <div className="flex gap-6 justify-between items-center w-full max-[768px]:flex-col max-[768px]:items-start py-4">
                <label className="w-1/4 max-[768px]:w-full text-[#263978] font-semibold text-base">
                  Settings
                </label>
                <div className="w-3/4 max-[768px]:w-full flex gap-8 flex-wrap">
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <Switch
                      checked={dndCheck}
                      onChange={(checked) => setDndCheck(checked)}
                    />
                    <span className="text-slate-700 font-medium text-sm">DND Check</span>
                  </div>

                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <Switch
                      checked={isEmailSent}
                      onChange={(checked) => setIsEmailSent(checked)}
                    />
                    <span className="text-slate-700 font-medium text-sm">Send Email</span>
                  </div>

                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <Switch
                      checked={sms}
                      onChange={(checked) => setSms(checked)}
                    />
                    <span className="text-slate-700 font-medium text-sm">Send SMS</span>
                  </div>

                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <Checkbox
                      checked={disableDefaultFilter}
                      onChange={(e) => setDisableDefaultFilter(e.target.checked)}
                    >
                      <span className="text-slate-700 font-medium text-sm">Disable Default Filter</span>
                    </Checkbox>
                  </div>
                </div>
              </div>

              {/* Email Type Field (Conditional) */}
              {isEmailSent && (
                <>
                  {/* Divider */}
                  <div className="border-t border-slate-200" />

                  <div className="flex gap-6 justify-between items-center w-full max-[768px]:flex-col max-[768px]:items-start py-4">
                    <label className="w-1/4 max-[768px]:w-full text-[#263978] font-semibold text-base">
                      Email Type
                    </label>
                    <Select
                      defaultValue="static"
                      className="w-3/4 max-[768px]:w-full select-modern"
                      size="large"
                      onChange={(value) => setEmailType(value)}
                      options={[
                        { value: 'static', label: 'Static' },
                        { value: 'dynamic', label: 'Dynamic' }
                      ]}
                      variant="borderless"
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </>

        {!orders && (
          <div className="p-4 flex items-center justify-center fixed bottom-0 left-56 max-[1024px]:left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
            <div className="w-4/5 max-[1024px]:w-5/6 max-[768px]:w-11/12 max-[425px]:w-full flex justify-end items-center">
              <button
                type="submit"
                className="hover:bg-[#1e2d5e] transition-all duration-200 max-[768px]:text-sm max-[425px]:text-xs tracking-wide flex gap-3 min-h-12 h-12 justify-center items-center bg-[#263978] px-8 rounded-lg text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={createExecution}
                disabled={loading}
              >
                {loading && (
                  <Oval
                    height={20}
                    width={20}
                    color="#ffffff"
                    wrapperStyle={{}}
                    wrapperClass=""
                    visible={true}
                    ariaLabel="oval-loading"
                    secondaryColor="#ccc"
                    strokeWidth={5}
                    strokeWidthSecondary={5}
                  />
                )}
                {loading ? "Processing..." : "Create Project"}
              </button>
            </div>
          </div>
        )}
    </>
  );
};

// Wrapper with Suspense for useRoomAPI hook
const NewSalesAgentInfoWrapper = () => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#263978]"></div>
    </div>
  }>
    <NewSalesAgentInfov2 />
  </Suspense>
);

export default NewSalesAgentInfoWrapper;