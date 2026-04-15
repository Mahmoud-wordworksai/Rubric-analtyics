import { Oval } from "react-loader-spinner";

export function MainLoader() {
    return (
      <div className="flex items-center justify-center h-screen">
        <Oval
          height={60}
          width={60}
          color="#263978"
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
          ariaLabel='oval-loading'
          secondaryColor="#ccc"
          strokeWidth={3}
          strokeWidthSecondary={4}

        />
      </div>
    );
}

export function SecondLoader() {
  return (
      <div className="absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center max-[768px]:top-12 z-20" style={{ backgroundColor: "rgba(241, 239, 250, 0.2)" }}>
        <Oval
          height={60}
          width={60}
          color="#263978"
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
          ariaLabel='oval-loading'
          secondaryColor="#ccc"
          strokeWidth={3}
          strokeWidthSecondary={4}
        />
      </div>
  );
}

export function NormalLoader() {
  return (
    <div className="flex items-center">
      <Oval
        height={25}
        width={25}
        color="#263978"
        wrapperStyle={{}}
        wrapperClass=""
        visible={true}
        ariaLabel='oval-loading'
        secondaryColor="#ccc"
        strokeWidth={3}
        strokeWidthSecondary={4}

      />
    </div>
  );
}

export function NormalLoader1() {
  return (
    <div className="flex items-center justify-center">
      <Oval
        height={40}
        width={40}
        color="#263978"
        wrapperStyle={{}}
        wrapperClass=""
        visible={true}
        ariaLabel='oval-loading'
        secondaryColor="#ccc"
        strokeWidth={3}
        strokeWidthSecondary={4}

      />
    </div>
  );
}