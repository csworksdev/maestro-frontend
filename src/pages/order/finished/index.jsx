import React from "react";
import Card from "@/components/ui/Card";
import OrderActive from "../active/orderActive";

const OrderFinished = () => {
  return (
    <div className="grid grid-cols-1 justify-end">
      <Card title="Order Finished">
        <OrderActive is_finished={true} />
      </Card>
    </div>
  );
};

export default OrderFinished;
