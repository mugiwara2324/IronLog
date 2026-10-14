import BodyPhotos from "../../components/Progress/BodyPhotos";

export default function Photos() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Photos de progression</h1>
      <p className="mt-2 text-neutral-400">Compare tes photos et suis ton évolution dans le temps.</p>
      <div className="mt-7">
        <BodyPhotos />
      </div>
    </div>
  );
}
