import React, { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { DateTime } from "luxon";
import Flatpickr from "react-flatpickr";

const OrderDetail = ({ params }) => {
  const FormValidationSchema = yup
    .object({
      product: yup.string().required("Product is required"),
    })
    .required();

  const {
    register,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });
  const onSubmit = (newData) => {};

  const jamLatihan = [
    { value: "06.00", label: "06.00" },
    { value: "07.00", label: "07.00" },
    { value: "08.00", label: "08.00" },
    { value: "09.00", label: "09.00" },
    { value: "10.00", label: "10.00" },
    { value: "11.00", label: "11.00" },
    { value: "12.00", label: "12.00" },
    { value: "13.00", label: "13.00" },
    { value: "14.00", label: "14.00" },
    { value: "15.00", label: "15.00" },
    { value: "16.00", label: "16.00" },
    { value: "17.00", label: "17.00" },
    { value: "18.00", label: "18.00" },
    { value: "19.00", label: "19.00" },
    { value: "20.00", label: "20.00" },
    { value: "21.00", label: "21.00" },
  ];

  if (!params || params.length == 0) {
    return <Loading />;
  }

  return (
    <div className="flex flex-wrap -mx-2">
      {params.map((item) => {
        return (
          <div
            key={item.index}
            className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2 mb-4"
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              key={item.index}
            >
              <Card
                title={"Pertemuan " + (item.meetings + 1)}
                className="min-w-max"
              >
                <div>
                  <label className="form-label" htmlFor="day">
                    Tanggal
                  </label>
                  <Flatpickr
                    defaultValue={item.day}
                    name="day"
                    options={{
                      dateFormat: "Y-m-d",
                    }}
                    className="form-control py-2"
                    disabled={item.is_presence}
                    onChange={(date) => setValue("day", date[0])}
                  />
                  {errors.order_date && (
                    <p className="error-message">{errors.order_date.message}</p>
                  )}
                </div>
                <Textinput
                  name="time"
                  label="Jam"
                  type="time"
                  placeholder=""
                  register={register}
                  error={errors.title}
                  defaultValue={item.time}
                  disabled={item.is_presence}
                />
              </Card>
            </form>
          </div>
        );
      })}
    </div>
  );
  //
};

export default OrderDetail;
