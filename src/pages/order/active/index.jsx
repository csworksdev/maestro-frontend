import React from "react";
import Card from "@/components/ui/Card";
import OrderActive from "./orderActive";
import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";

const Order = () => {
  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Order"
        headerslot={
          <Button className="btn-primary ">
            <Link to="add" isupdate="false">
              Tambah
            </Link>
          </Button>
        }
      >
        <OrderActive is_finished={false} />
      </Card>
    </div>
  );
};

export default Order;
