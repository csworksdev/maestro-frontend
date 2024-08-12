import React from "react";
import Card from "@/components/ui/Card";
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
        <OrderActive is_finished={false} />
        {/* <Tab.Group>
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
        </Tab.Group> */}
      </Card>
    </div>
  );
};

export default Order;
