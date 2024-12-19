import React from "react";
import Card from "@/components/ui/Card";
import OrderActive from "./orderActive";

const Order = () => {
  return (
    <div className="grid grid-cols-1 justify-end">
      <Card title="Order">
        <OrderActive is_finished={false} />
      </Card>
    </div>
  );
};

export default Order;
