import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddOrder, EditOrder } from "@/axios/masterdata/order";
import { getProdukPool } from "@/axios/masterdata/produk";
import { getSiswaAll } from "@/axios/masterdata/siswa";
import { getTrainerAll } from "@/axios/masterdata/trainer";
import Select from "@/components/ui/Select";
import Flatpickr from "react-flatpickr";
import Loading from "@/components/Loading";
import { DateTime } from "luxon";
import OrderDetail from "./orderDetail";
import { getKolamAll } from "@/axios/referensi/kolam";
import {
  AddOrderDetail,
  EditOrderDetail,
  getOrderDetailByParent,
} from "@/axios/masterdata/orderDetail";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";
  const [productData, setProductData] = useState([]);
  const [kolamOption, setKolamOption] = useState([]);
  const [productOption, setProductOption] = useState([]);
  const [studentOption, setStudentOption] = useState([]);
  const [trainerOption, setTrainerOption] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);

  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (isUpdate) {
      if (data.product) setValue("product", data.product);
      if (data.student) setValue("student", data.student);
      if (data.trainer) setValue("trainer", data.trainer);
      if (data.order_date) setValue("order_date", data.order_date);
      if (data.price) setValue("price", data.price);
    }
  }, [isUpdate, data, setValue]);

  const loadReference = async () => {
    try {
      const kolamResponse = await getKolamAll();

      const studentResponse = await getSiswaAll();
      const trainerResponse = await getTrainerAll();

      // setProductData(productResponse.data.results);
      const kolamOption = kolamResponse.data.results.map((item) => ({
        value: item.pool_id,
        label: item.name,
      }));

      const studentOptions = studentResponse.data.results.map((item) => ({
        value: item.student_id,
        label: item.fullname,
      }));

      const trainerOptions = trainerResponse.data.results.map((item) => ({
        value: item.trainer_id,
        label: item.fullname,
      }));

      setKolamOption(kolamOption);

      setStudentOption(studentOptions);
      setTrainerOption(trainerOptions);

      if (data.pool) {
        setProductOption([]);
        const productResponse = await getProdukPool(data.pool);
        setProductData(productResponse.data.results);
        const productOptions = productResponse.data.results.map((item) => ({
          value: item.product_id,
          label: item.name,
        }));
        setProductOption(productOptions);
      }

      if (isUpdate) {
        setOrderDetail([]);
        const orderDetailResponse = await getOrderDetailByParent(data.order_id);
        setOrderDetail(orderDetailResponse.data.results);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReference();
  }, [loading, isUpdate]);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    AddOrder(data).then((res) => {
      if (res.status) {
        for (let index = 0; index < orderDetail.length; index++) {
          const element = orderDetail[index];
          element.push("order_id: " + data.order_id);
          AddOrderDetail(element).then((res) => {
            if (res.status) {
              // Swal.fire("Added!", "Your file has been added.", "success").then(
              //   () => navigate(-1)
              // );
            }
          });
        }
        Swal.fire("Added!", "Your file has been added.", "success").then(() =>
          navigate(-1)
        );
      }
    });
  };

  const handleUpdate = (updatedData) => {
    EditOrder(data.order_id, updatedData).then((res) => {
      if (res.status) {
        for (let index = 0; index < orderDetail.length; index++) {
          const element = orderDetail[index];
          AddOrderDetail(element).then((res) => {
            if (res.status) {
              console.log(res.status);
            }
          });
        }
        Swal.fire("Added!", "Your file has been added.", "success").then(() =>
          navigate(-1)
        );
      }
    });
  };

  const onSubmit = (newData) => {
    const updatedData = {
      ...data,
      order_id: newData.order_id,
      order_date: DateTime.fromJSDate(
        newData.order_date ?? data.order_date
      ).toFormat("yyyy-MM-dd"),
      product: newData.product,
      promo: newData.promo,
      expire_date: DateTime.now().plus({ days: 60 }).toFormat("yyyy-MM-dd"),
      is_finish: newData.is_finish,
      notes: newData.notes,
      price: newData.price,
      is_paid: newData.is_paid,
      student: newData.student,
      register_date: DateTime.fromJSDate(new Date()).toFormat("yyyy-MM-dd"),
      trainer: newData.trainer,
      pool: newData.pool,
    };

    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  const handleProductChange = (e) => {
    var findData = productData.find((item) => item.product_id === e);
    setValue("price", findData.price);
    createDetail(findData);
  };

  const handlePoolChange = async (e) => {
    setProductOption([]);
    const productResponse = await getProdukPool(e);
    setProductData(productResponse.data.results);
    const productOptions = productResponse.data.results.map((item) => ({
      value: item.product_id,
      label: item.name,
    }));
    setProductOption(productOptions);
  };

  const createDetail = (params) => {
    setOrderDetail([]);
    const { meetings } = params;
    let temp = [];
    let baseOrderDetail = {
      order_id: data.order_id,
      meetings: 1,
      day: null,
      time: DateTime.fromISO("17:00").toFormat("hh:mm"),
      is_presence: false,
    };

    for (let index = 0; index < meetings; index++) {
      if (index > 0) {
        temp.push({
          ...baseOrderDetail,
          day: DateTime.fromISO(temp[index - 1].day)
            .plus({ days: 7 })
            .toISO(),
          meetings: index,
        });
      } else temp.push({ ...baseOrderDetail, meetings: index });
    }
    setOrderDetail(temp);
  };

  if (loading && isUpdate) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-5">
      <Card title={`${isUpdate ? "Update" : "Add"} Order`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            name="pool"
            label="Kolam"
            placeholder="Pilih Kolam"
            register={register}
            error={errors.title}
            options={kolamOption}
            defaultValue={isUpdate ? data.pool : ""}
            onChange={(e) => handlePoolChange(e.target.value)}
          />
          <Select
            name="product"
            label="Produk"
            placeholder="Pilih Produk"
            register={register}
            error={errors.title}
            options={productOption}
            defaultValue={isUpdate ? data.product : ""}
            onChange={(e) => handleProductChange(e.target.value)}
          />
          <div>
            <label className="form-label" htmlFor="order_date">
              Tanggal Order
            </label>
            <Flatpickr
              defaultValue={isUpdate ? data.order_date : ""}
              name="order_date"
              options={{
                dateFormat: "Y-m-d",
              }}
              className="form-control py-2"
              onChange={(date) => setValue("order_date", date[0])}
            />
            {errors.order_date && (
              <p className="error-message">{errors.order_date.message}</p>
            )}
          </div>
          <Textinput
            name="promo"
            label="Promo"
            type="text"
            placeholder="Masukan jumlah promo"
            register={register}
            error={errors.title}
            defaultValue={isUpdate ? data.promo : ""}
          />
          <Textinput
            name="price"
            label="Harga"
            type="text"
            placeholder="Masukan harga"
            register={register}
            error={errors.title}
            defaultValue={isUpdate ? data.price : ""}
            disabled={true}
            // isMask={true}
            options={{
              numeral: true,
              numeralDecimalScale: 1,
            }}
          />
          <Select
            name="student"
            label="Siswa"
            placeholder="Pilih Siswa"
            register={register}
            error={errors.title}
            options={studentOption}
            defaultValue={isUpdate ? data.product : ""}
            onChange={(e) => console.log(e.target.value)}
          />
          <Select
            name="trainer"
            label="Pelatih"
            placeholder="Pilih pelatih"
            register={register}
            error={errors.title}
            options={trainerOption}
            defaultValue={isUpdate ? data.trainer : ""}
          />
          <div className="ltr:text-right rtl:text-left space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={handleCancel}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-dark text-center">
              {isUpdate ? "Update" : "Add"} Order
            </button>
          </div>
        </form>
      </Card>
      <OrderDetail params={orderDetail} />
    </div>
  );
};

export default Edit;
