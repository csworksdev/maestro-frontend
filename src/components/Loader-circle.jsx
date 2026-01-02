import React from "react";
import Card from "./ui/Card";
import PoolLoader from "./PoolLoader";

const LoaderCircle = () => {
  return (
    <Card className="app_height flex flex-col items-center justify-center">
      <PoolLoader size="md" />
    </Card>
  );
};

export default LoaderCircle;
