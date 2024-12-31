import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Swal from "sweetalert2";
import * as yup from "yup";
import { DateTime } from "luxon";
import Flatpickr from "react-flatpickr";

import {
  EditOrderDetail,
  GetOrderDetailByOrderId,
} from "@/axios/masterdata/orderDetail";
import Loading from "@/components/Loading";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { hari, jam } from "@/constant/jadwal-default";
import Checkbox from "@/components/ui/Checkbox";
import Textarea from "@/components/ui/Textarea";

const DetailOrder = ({ state, updateParentData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state ?? state.data;

  const [detailList, setDetailList] = useState([]);
  const [loading, setLoading] = useState(true);

  const schema = yup.object().shape({}).required();

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  // Load order details
  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        const response = await GetOrderDetailByOrderId(data.order_id);
        setDetailList(
          response.data.results.slice().sort((a, b) => a.meet - b.meet)
        );
      } catch (error) {
        Swal.fire("Error", "Failed to load reference data.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [data.order_id]);

  if (loading) return <Loading />;

  // Update order detail
  const updateOrderDetail = async (updatedData) => {
    try {
      const response = await EditOrderDetail(
        updatedData.order_detail_id,
        updatedData
      );
      if (response.status) {
        updateParentData(updatedData);
        updateListData(updatedData);
        // Swal.fire({
        //   title: "Edited!",
        //   text: `${updatedData.order_detail_id} - ${updatedData.schedule_date}`,
        //   icon: "success",
        //   timer: 100,
        //   position: "top-end",
        // });
      }
    } catch (error) {
      Swal.fire("Error", "Failed to update order detail.", "error");
    }
  };

  const updateListData = (newData) => {
    const data = [...detailList];

    let temp = data.map((item) => ({
      ...item,
      is_paid:
        item.order_detail_id === newData.order_detail_id
          ? newData.is_paid
          : item.is_paid,
      is_presence:
        item.order_detail_id === newData.order_detail_id
          ? newData.is_presence
          : item.is_presence,
      jam:
        item.order_detail_id === newData.order_detail_id
          ? newData.real_time
          : item.jam,
      real_date:
        item.order_detail_id === newData.order_detail_id
          ? newData.real_date
          : item.real_date,
    }));

    setDetailList(temp);
  };

  // MeetCard Component
  const MeetCard = ({ params }) => {
    const schema = yup.object().shape({}).required();

    const {
      register,
      handleSubmit,
      setValue,
      watch,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(schema),
      mode: "all",
    });

    useEffect(() => {
      if (params.schedule_date) {
        setValue(
          "schedule_date",
          DateTime.fromISO(params.schedule_date).toISODate()
        );
      }
      if (params.real_date) {
        setValue("real_date", DateTime.fromISO(params.real_date).toISODate());
      }
      setValue("is_presence", params.is_presence); // Initialize checkbox state
      setValue("is_paid", params.is_paid); // Initialize checkbox state
    }, [params, setValue]);

    const onSubmit = (formData) => {
      let updatedData = {
        order_detail_id: params.order_detail_id,
        schedule_date: DateTime.fromISO(formData.schedule_date).toFormat(
          "yyyy-MM-dd"
        ),
        jam: formData.jam,
        is_presence: formData.is_presence, // Checkbox state
        is_paid: formData.is_paid, // Checkbox state
        real_date: null,
        presence_day: null,
      };

      if (formData.is_presence) {
        updatedData = {
          ...updatedData,
          real_date: DateTime.fromISO(formData.real_date).toFormat(
            "yyyy-MM-dd"
          ),
          presence_day: DateTime.fromISO(formData.real_date).toFormat(
            "yyyy-MM-dd"
          ),
        };
      }

      // console.log(updatedData);
      updateOrderDetail(updatedData);
    };

    return (
      <Card title={`Pertemuan Ke: ${params.meet}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label" htmlFor="schedule_date">
              Tanggal Latihan
            </label>
            <Flatpickr
              value={params.schedule_date} // Display parsed date
              options={{
                dateFormat: "Y-m-d",
                disableMobile: true,
                // maxDate: DateTime.now().toFormat("yyyy-MM-dd"),
              }}
              className="form-control py-2"
              onChange={(dates) => {
                if (dates && dates[0]) {
                  setValue(
                    "schedule_date",
                    DateTime.fromJSDate(dates[0]).toISODate() // Convert to ISO for consistency
                  );
                }
              }}
              disabled={false}
            />
            {errors.schedule_date && (
              <p className="error-message">{errors.schedule_date.message}</p>
            )}
          </div>
          <div>
            <label className="form-label" htmlFor="real_date">
              Tanggal Absensi Pelatih
            </label>
            <Flatpickr
              defaultValue={params.real_date}
              options={{
                dateFormat: "Y-m-d",
                disableMobile: true,
                maxDate: DateTime.now().toFormat("yyyy-MM-dd"),
              }}
              className="form-control py-2"
              onChange={(dates) => {
                if (dates && dates[0]) {
                  setValue(
                    "real_date",
                    DateTime.fromJSDate(dates[0]).toISODate()
                  );
                }
              }}
            />
            {errors.real_date && (
              <p className="error-message">{errors.real_date.message}</p>
            )}
          </div>
          <Select
            name="jam"
            label="Jam"
            placeholder="Pilih Jam"
            register={register}
            error={errors.jam?.message}
            options={jam}
            defaultValue={params.time}
            onChange={(e) => setValue("jam", e.target.value)}
          />
          {/* di hide dulu bisi ada yang ngedit sembarangan*/}
          {/* <div>
            <label className="form-label" htmlFor="is_presence">
              Kehadiran
            </label>
            <Checkbox
              name="is_presence"
              label={"Hadir"}
              value={watch("is_presence")}
              onChange={(e) => setValue("is_presence", e.target.checked)}
            />
          </div>
          <div>
            <label className="form-label" htmlFor="is_presence">
              Pembayaran
            </label>
            <Checkbox
              name="is_paid"
              label={"Sudah dibayar"}
              value={watch("is_paid")}
              onChange={(e) => setValue("is_paid", e.target.checked)}
            />
          </div> */}
          <div className="ltr:text-right rtl:text-left space-x-3">
            {params.is_paid ? (
              <span>Pertemuan sudah dibayar</span>
            ) : (
              <Button type="submit">Update</Button>
            )}
            {/* <Button type="submit">Update</Button> */}
          </div>
        </form>
      </Card>
    );
  };

  // OrderMaster Component
  const OrderMaster = ({ params }) => (
    <Card>
      <div className="grid grid-cols-2 gap-4">
        <OrderField label="Order ID" value={params.order_id} />
        <OrderField label="Nama Pelatih" value={params.trainer_name} />
        {/* <OrderField label="Siswa" value={params.listname} /> */}
        <Textarea
          name={"siswa"}
          label={"Siswa"}
          register={register}
          defaultValue={params.listname.replace(", ", `\n`)}
          disabled={true}
        />
        <OrderField label="Produk" value={params.product_name} />
        <OrderField label="Kolam" value={params.pool_name} />
        <OrderField label="Hari" value={params.day} />
        <OrderField label="Jam" value={params.time} />
      </div>
    </Card>
  );

  // Reusable OrderField Component
  const OrderField = ({ label, value }) => (
    <Textinput
      name={label.toLowerCase().replace(" ", "_")}
      label={label}
      type="text"
      register={register}
      defaultValue={value}
      disabled={true}
    />
  );

  return (
    <>
      {/* <Button
        text="Kembali"
        onClick={(e) => {
          e.preventDefault();
          navigate(-1);
        }}
        type="button"
        className="bg-primary-500 text-white mb-4"
        icon="heroicons-outline:arrow-uturn-left"
      /> */}
      <div className="grid grid-cols-1 gap-4">
        <OrderMaster params={data} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
          {detailList.map((item, index) => (
            <MeetCard key={index} params={item} />
          ))}
        </div>
      </div>
    </>
  );
};

export default DetailOrder;
