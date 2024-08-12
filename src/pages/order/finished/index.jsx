import React from "react";
import OrderActive from "../active/orderActive";
import Card from "@/components/ui/Card";

const OrderFinished = () => {
  return (
    <div className="grid grid-cols-1 justify-end">
      <Card title="Finished Order">
        <OrderActive is_finished={true} />
      </Card>
    </div>
  );
};

export default OrderFinished;
