import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React, { useEffect, useState } from "react";
import { Await, useLocation, useNavigate, useParams } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import {
  AddOrder,
  EditOrder,
  FindAvailableTrainer,
} from "@/axios/masterdata/order";
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
import Radio from "@/components/ui/Radio";
import { UpdateTrainerSchedule } from "@/axios/masterdata/trainerSchedule";

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
  const [selectGenderOption, setSelectGenderOption] = useState("L");
  const [loading, setLoading] = useState(true);
  const [filterTrainerByPool, setFilterTrainerByPool] = useState("");
  const [filterTrainerByDay, setFilterTrainerByDay] = useState("Senin");
  const [filterTrainerByTime, setFilterTrainerByTime] = useState("09.00");
  const [filterTrainerByGender, setFilterTrainerByGender] = useState("L");
  const [filterTrainerParams, setFilterTrainerParams] = useState({
    day: "",
    time: "",
    gender: "",
    pool_id: "",
  });

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
      const kolamResponse = await getKolamAll({
        page_size: 50,
      });

      const studentResponse = await getSiswaAll();

      const kolamOption = kolamResponse.data.results.map((item) => ({
        value: item.pool_id,
        label: item.name,
      }));

      const studentOptions = studentResponse.data.results.map((item) => ({
        value: item.student_id,
        label: item.fullname,
      }));

      setKolamOption(kolamOption);

      setStudentOption(studentOptions);
      // setTrainerOption(trainerOptions);

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

      // if (isUpdate) {
      //   setOrderDetail([]);
      //   const orderDetailResponse = await getOrderDetailByParent(data.order_id);
      //   setOrderDetail(orderDetailResponse.data.results);
      // }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const jam = [
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
  ];

  const hari = [
    { value: "Senin", label: "Senin" },
    { value: "Selasa", label: "Selasa" },
    { value: "Rabu", label: "Rabu" },
    { value: "Kami", label: "Kami" },
    { value: "Jumat", label: "Jumat" },
    { value: "Sabtu", label: "Sabtu" },
    { value: "Minggu", label: "Minggu" },
  ];

  const genderOption = [
    { value: "L", label: "Laki-Laki" },
    { value: "P", label: "Perempuan" },
  ];

  useEffect(() => {
    loadReference();
  }, [loading, isUpdate]);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    AddOrder(data).then((res) => {
      if (res.status) {
        Swal.fire("Added!", "Your file has been added.", "success").then(() => {
          const temp = orderDetail.map((item, index) => {
            item.order = res.data.order_id;
            item.day = filterTrainerByDay;
            item.time = filterTrainerByTime;
            item.schedule_date = DateTime.fromISO(data.start_date)
              .plus({ days: 7 * (index + 1) })
              .toFormat("yyyy-MM-dd");
            return item;
          });
          for (let index = 0; index < temp.length; index++) {
            // (temp[index].schedule_date = DateTime.fromISO(data.start_date)
            //   .plus({ days: 7 * (index + 1) })
            //   .toFormat("yyyy-MM-dd")),
            AddOrderDetail(temp[index], data).then((addres) => {
              if (addres.status == "success") {
                console.log("finnish");
              }
            });
          }

          // update trainer avail
          const params = {
            coach: data.trainer,
            day: filterTrainerByDay,
            time: filterTrainerByTime,
            is_free: false,
          };
          UpdateTrainerSchedule(params).then((results) => {
            navigate(-1);
          });
        });
      }
    });
  };

  const handleUpdate = (updatedData) => {
    EditOrder(data.order_id, updatedData).then((res) => {
      if (res.status) {
        Swal.fire("Added!", "Your file has been added.", "success").then(() => {
          navigate(-1);
          for (let index = 0; index < orderDetail.length; index++) {
            const element = orderDetail[index];
            AddOrderDetail(element).then((res) => {
              if (res.status) {
                console.log(res.status);
              }
            });
          }
        });
      }
    });
  };

  const onSubmit = (newData) => {
    const updatedData = {
      ...data,
      order_id: newData.order_id,
      order_date: isUpdate
        ? data.order_date
        : DateTime.now().toFormat("yyyy-MM-dd"),
      product: newData.product,
      promo: newData.promo,
      expire_date: isUpdate
        ? data.expire_date
        : DateTime.fromJSDate(newData.start_date)
            .plus({ days: 60 })
            .toFormat("yyyy-MM-dd"),
      is_finish: newData.is_finish,
      notes: newData.notes,
      price: newData.price,
      is_paid: newData.is_paid,
      student: newData.student,
      start_date: isUpdate
        ? data.start_date
        : DateTime.fromJSDate(newData.start_date).toFormat("yyyy-MM-dd"),
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
    const findData = productData.find((item) => item.product_id === e);
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
    setFilterTrainerByPool(e);
  };

  const handleGenderOption = (e) => {
    setSelectGenderOption(e.target.value);
    setFilterTrainerByGender(e.target.value);
  };

  const handleHariOption = (e) => {
    setFilterTrainerByDay(e);
  };

  const handleJamOption = (e) => {
    setFilterTrainerByTime(e);
  };

  useEffect(() => {
    setFilterTrainerParams((prevParams) => ({
      ...prevParams,
      pool_id: filterTrainerByPool,
    }));
    // Reset product selection and price when pool changes
    setValue("price", "");
    setValue("product", "");
  }, [filterTrainerByPool]);

  useEffect(() => {
    setFilterTrainerParams((prevParams) => ({
      ...prevParams,
      gender: filterTrainerByGender,
      day: filterTrainerByDay,
      time: filterTrainerByTime,
    }));
  }, [filterTrainerByGender, filterTrainerByDay, filterTrainerByTime]);

  useEffect(() => {
    const filterTrainer = async () => {
      setTrainerOption([]);
      const trainerResponse = await FindAvailableTrainer(filterTrainerParams);
      const trainerOptions = trainerResponse.data.results.map((item) => ({
        value: item.trainer_id,
        label: item.fullname,
      }));
      setTrainerOption(trainerOptions);
    };
    filterTrainer();
  }, [filterTrainerParams]);

  const createDetail = (params) => {
    setOrderDetail([]);
    const { meetings } = params;
    let temp = [];
    let baseOrderDetail = {
      day: filterTrainerByDay,
      // schedule_date: data.start_date,
      time: filterTrainerByTime,
      is_presence: false,
      is_paid: false,
    };

    for (let index = 1; index <= meetings; index++) {
      if (index > 0) {
        temp.push({
          ...baseOrderDetail,
          meet: index,
        });
      } else temp.push({ ...baseOrderDetail, meet: index });
    }
    setOrderDetail(temp);
  };

  const getNearestDay = (date) => {
    const day = date.getDay();
    const nextMonday = new Date(date);
    nextMonday.setDate(date.getDate() + ((8 - day) % 7));
    return nextMonday;
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
          <div className="grid grid-cols-2 gap-4">
            <Select
              name="day"
              label="Hari"
              placeholder="Pilih Hari"
              register={register}
              error={errors.title}
              options={hari}
              defaultValue={"Senin"}
              onChange={(e) => handleHariOption(e.target.value)}
            />
            <Select
              name="jam"
              label="Jam"
              placeholder="Pilih Jam"
              register={register}
              error={errors.title}
              options={jam}
              defaultValue={"09.00"}
              onChange={(e) => handleJamOption(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap space-xy-5">
            {genderOption.map((option) => (
              <Radio
                key={option.value}
                label={option.label}
                name="gender"
                value={option.value}
                checked={selectGenderOption === option.value}
                onChange={handleGenderOption}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="hidden">
            <label className="form-label" htmlFor="order_date">
              Tanggal Order
            </label>
            <Flatpickr
              defaultValue={isUpdate ? data.order_date : DateTime.utc().toISO()}
              name="order_date"
              options={{
                dateFormat: "Y-m-d",
              }}
              className="form-control py-2"
              onChange={(date) => setValue("order_date", date[0])}
              disabled={true}
            />
            {errors.order_date && (
              <p className="error-message">{errors.order_date.message}</p>
            )}
          </div>
          <div>
            <label className="form-label" htmlFor="start_date">
              Tanggal Mulai
            </label>
            <Flatpickr
              defaultValue={isUpdate ? data.start_date : DateTime.utc().toISO()}
              name="start_date"
              options={{
                dateFormat: "Y-m-d",
                minDate: DateTime.now().toFormat("yyyy-MM-dd"),
              }}
              className="form-control py-2 bg-black-50 from-black-900"
              onChange={(date) => setValue("start_date", date[0])}
            />
            {errors.start_date && (
              <p className="error-message">{errors.start_date.message}</p>
            )}
          </div>
          <Textinput
            name="promo"
            label="Promo"
            type="text"
            placeholder="Masukan promo"
            register={register}
            error={errors.title}
            defaultValue={isUpdate ? data.promo : ""}
          />
          <Select
            name="student"
            label="Siswa"
            placeholder="Pilih Siswa"
            register={register}
            error={errors.title}
            options={studentOption}
            defaultValue={isUpdate ? data.product : ""}
            // onChange={(e) => console.log(e.target.value)}
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
      {/* <OrderDetail params={orderDetail} /> */}
    </div>
  );
};

export default Edit;
