
const IframeCard = ({ src, id }: { src: string, id: string }) => {

    return (
      <iframe 
        src={`${src}?bot=${id}`}
        id={id}
        className="w-full" 
        style={{ height: 600 }} frameBorder="0"
      />
    );
  };

  export default IframeCard;