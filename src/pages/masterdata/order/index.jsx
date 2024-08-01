import React, { Fragment, useRef, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Tab, Disclosure, Transition, Menu } from "@headlessui/react";
import Table from "@/components/globals/table/table";
import Loading from "@/components/Loading";
import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DeleteOrder, getOrderAll } from "@/axios/masterdata/order";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import OrderActive from "./orderActive";

const buttons = [
  {
    title: "Active",
    icon: "heroicons-outline:home",
  },
  {
    title: "Finished",
    icon: "heroicons-outline:user",
  },
];

const Order = () => {
  return (
    <div className="grid grid-cols-1 justify-end">
      <Card title="Order">
        <Tab.Group>
          <Tab.List className="lg:space-x-8 md:space-x-4 space-x-0 rtl:space-x-reverse">
            {buttons.map((item, i) => (
              <Tab as={Fragment} key={i}>
                {({ selected }) => (
                  <button
                    className={` text-sm font-medium mb-7 capitalize bg-white
             dark:bg-slate-800 ring-0 foucs:ring-0 focus:outline-none px-2
              transition duration-150 before:transition-all before:duration-150 relative 
              before:absolute before:left-1/2 before:bottom-[-6px] before:h-[1.5px] before:bg-primary-500 
              before:-translate-x-1/2 
              
              ${
                selected
                  ? "text-primary-500 before:w-full"
                  : "text-slate-500 before:w-0 dark:text-slate-300"
              }
              `}
                  >
                    {item.title}
                  </button>
                )}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <OrderActive is_finished={false} />
            </Tab.Panel>
            <Tab.Panel>
              <OrderActive is_finished={true} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </Card>
    </div>
  );
};

export default Order;
