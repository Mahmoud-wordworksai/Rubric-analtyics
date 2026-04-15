/* eslint-disable @typescript-eslint/no-explicit-any */
function Card({children}: any) {
  return (
    // <div className="p-10 max-[768px]:p-3 max-[768px]:mt-3 mt-5 mb-10 border-t-4 border-[#04ccfb] bg-white h-max rounded-md shadow w-full">
    <div>
        {children}
    </div>
  )
}

export default Card;