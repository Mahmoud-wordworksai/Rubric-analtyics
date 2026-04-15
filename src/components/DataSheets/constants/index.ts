import { API_BASE_URL, API_KEY } from "@/constants";

export { API_BASE_URL, API_KEY };

export const DEFAULT_PAGINATION = {
  current: 1,
  pageSize: 10,
  total: 0
};

export const DEFAULT_ROWS_PAGINATION = {
  current: 1,
  pageSize: 100,
  total: 0
};

export const UPDATABLE_COLUMNS = [
  { value: "FINAL_EMI_AMT", label: "FINAL_EMI_AMT" },
  { value: "EMI_Date", label: "EMI_Date" },
  { value: "Payment_Link", label: "Payment_Link" },
  { value: "ALLOC_DATE", label: "ALLOC_DATE" },
  { value: "CAMPAIGN_FLAG", label: "CAMPAIGN_FLAG" },
  { value: "CAMPAIGN_NAME", label: "CAMPAIGN_NAME" },
  { value: "ALLOCATION", label: "ALLOCATION" },
  { value: "DIALED_DATETIME", label: "DIALED_DATETIME" },
  { value: "LANGUAGE", label: "LANGUAGE" },
  { value: "DEVICE_CONTACT_METHOD", label: "DEVICE_CONTACT_METHOD" },
  { value: "DEVICE_START_TIME", label: "DEVICE_START_TIME" },
  { value: "CUSTOMER_START_TIME", label: "CUSTOMER_START_TIME" },
  { value: "BOT/IVR_STATUS", label: "BOT/IVR_STATUS" },
  { value: "DISPOSITION", label: "DISPOSITION" },
  { value: "STATUS_CODE", label: "STATUS_CODE" },
  { value: "STATUS_REASON_CODE", label: "STATUS_REASON_CODE" },
  { value: "PROMISE_REMINDER_FLAG", label: "PROMISE_REMINDER_FLAG" },
  { value: "PROMISE_REMINDER_METHOD", label: "PROMISE_REMINDER_METHOD" },
  { value: "PTP_DATE", label: "PTP_DATE" },
  { value: "PTP_AMT", label: "PTP_AMT" },
  { value: "PTP_DAYS", label: "PTP_DAYS" },
  { value: "PTP_FLAG", label: "PTP_FLAG" },
  { value: "PAID_FLAG", label: "PAID_FLAG" },
  { value: "SMS_SENT_STATUS", label: "SMS_SENT_STATUS" },
  { value: "SMS_DELIVERY_STATUS", label: "SMS_DELIVERY_STATUS" },
  { value: "SMS_CLICK_STATUS", label: "SMS_CLICK_STATUS" },
  { value: "SMS_CODE", label: "SMS_CODE" },
  { value: "CUSTOMER_END_TIME", label: "CUSTOMER_END_TIME" },
  { value: "DURATION", label: "DURATION" },
  { value: "ATTEMPT_COUNT", label: "ATTEMPT_COUNT" }
];

export const DATE_FIELDS = ['EMI_Date', 'ALLOC_DATE'];

export const FILE_TYPES = {
  EXCEL: ['.xlsx', '.xls'],
  CSV: ['.csv'],
  PDF: ['.pdf']
};

export const ACCEPTED_FILE_TYPES = ".csv";

export const DEFAULT_CHUNK_SIZE = 10000;