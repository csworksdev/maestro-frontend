import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import AsyncSelect from "react-select/async"; // Import AsyncSelect
import Select from "@/components/ui/Select";
import Flatpickr from "react-flatpickr";
import { DateTime } from "luxon";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Loading from "@/components/Loading";
import Radio from "@/components/ui/Radio";
import {
  AddOrder,
  EditOrder,
  FindAvailableTrainer,
} from "@/axios/masterdata/order";
import { getProdukPool } from "@/axios/masterdata/produk";
import { getSiswaAll, searchSiswa } from "@/axios/masterdata/siswa"; // Import searchSiswa function
import { getTrainerAll } from "@/axios/masterdata/trainer";
import { getKolamAll } from "@/axios/referensi/kolam";
import {
  AddOrderDetail,
  EditOrderDetail,
  getOrderDetailByParent,
} from "@/axios/masterdata/orderDetail";
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
  const [selectedStudents, setSelectedStudents] = useState([]); // State for selected students
  const [defaultStudentOptions, setDefaultStudentOptions] = useState([]); // State for default student options
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
  const [maxStudents, setMaxStudents] = useState(0); // State for max students
  const [trainerList, setTrainerList] = useState(0);

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
      if (data.students) {
        const transformedStudents = data.students.map((student) => {
          const option = studentOption.find(
            (opt) => opt.value === student.student_id
          );
          return {
            value: student.student_id,
            label: option ? option.label : student.fullname,
          };
        });
        setSelectedStudents(transformedStudents);
      }
      if (data.trainer) setValue("trainer", data.trainer);
      if (data.order_date) setValue("order_date", data.order_date);
      if (data.price) setValue("price", data.price);
    }
  }, [isUpdate, data, setValue, studentOption]);

  const loadReference = useCallback(async () => {
    try {
      const kolamResponse = await getKolamAll({ page_size: 50 });
      const studentResponse = await getSiswaAll();

      const kolamOption = kolamResponse.data.results.map((item) => ({
        value: item.pool_id,
        label: item.name,
      }));

      const studentOptions = studentResponse.data.results.map((item) => ({
        value: item.student_id,
        label: item.fullname,
      }));

      if (isUpdate) {
        data.students.map((item) => {
          studentOptions.push({
            value: item.student_id,
            label: item.student_fullname,
          });
        });
      }

      setKolamOption(kolamOption);
      setStudentOption(studentOptions);
      setDefaultStudentOptions(studentOptions.slice(0, 10)); // Set default options

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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [data.pool]);

  useEffect(() => {
    loadReference();
  }, [loadReference]);

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
    { value: "Kamis", label: "Kamis" },
    { value: "Jumat", label: "Jumat" },
    { value: "Sabtu", label: "Sabtu" },
    { value: "Minggu", label: "Minggu" },
  ];

  const genderOption = [
    { value: "L", label: "Laki-Laki" },
    { value: "P", label: "Perempuan" },
  ];

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    AddOrder(data).then((res) => {
      if (res) {
        Swal.fire("Added!", "Your file has been added.", "success").then(() => {
          const product = productData.find(
            (item) => item.product_id === data.product
          );
          const trainer = trainerList.find(
            (i) => i.trainer_id === data.trainer
          );
          const temp = orderDetail.map((item, index) => {
            item.order = res.data.order_id;
            item.day = filterTrainerByDay;
            item.time = filterTrainerByTime;
            item.price_per_meet =
              (data.price * parseInt(trainer.precentage_fee)) /
              100 /
              product.meetings;
            item.schedule_date = DateTime.fromISO(data.start_date)
              .plus({ days: 7 * (index + 1) })
              .toFormat("yyyy-MM-dd");
            return item;
          });
          for (let index = 0; index < temp.length; index++) {
            AddOrderDetail(temp[index], data).then((addres) => {
              if (addres.status === "success") {
                console.log("finished");
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
          UpdateTrainerSchedule(params).then(() => {
            navigate(-1);
          });
        });
      }
    });
  };

  const handleUpdate = (updatedData) => {
    EditOrder(data.order_id, updatedData).then((res) => {
      if (res.status) {
        Swal.fire("Updated!", "Your file has been updated.", "success").then(
          () => {
            navigate(-1);
            for (let index = 0; index < orderDetail.length; index++) {
              const element = orderDetail[index];
              AddOrderDetail(element).then((res) => {
                if (res.status) {
                  console.log(res.status);
                }
              });
            }
          }
        );
      }
    });
  };

  const onSubmit = (newData) => {
    const product = productData.find(
      (item) => item.product_id === newData.product
    );
    const trainer = trainerList.find((i) => i.trainer_id === newData.trainer);
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
      students: selectedStudents.map((student) => ({
        student_id: student.value,
      })), // Convert to list of dictionaries
      start_date: isUpdate
        ? data.start_date
        : DateTime.fromJSDate(newData.start_date).toFormat("yyyy-MM-dd"),
      trainer: newData.trainer,
      pool: newData.pool,
      package: product.package,
      trainer_percentage: parseInt(trainer.precentage_fee),
      company_percentage: 100 - trainer.precentage_fee,
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
    setMaxStudents(findData.max_student); // Set the max student limit from the package
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
      if (isUpdate) {
        trainerOptions.push({
          value: data.trainer,
          label: data.trainer_name,
        });
      }
      setTrainerList(trainerResponse.data.results);
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

  const handleStudentChange = (selectedOptions) => {
    if (selectedOptions.length <= maxStudents) {
      setSelectedStudents(selectedOptions);
    } else {
      Swal.fire(
        "Limit Exceeded",
        `You can only select up to ${maxStudents} students.`,
        "warning"
      );
    }
  };

  const loadOptions = async (inputValue, callback) => {
    try {
      const response = await searchSiswa({ search: inputValue });
      const students = response.data.results.map((student) => ({
        value: student.student_id,
        label: student.fullname,
      }));
      callback(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      callback([]);
    }
  };

  const defaultOptions = async () => {
    try {
      const response = await getSiswaAll({
        page_size: 10,
      });
      const students = response.data.results.map((student) => ({
        value: student.student_id,
        label: student.fullname,
      }));
      setDefaultStudentOptions(students);
    } catch (error) {
      console.error("Error fetching default students:", error);
    }
  };

  useEffect(() => {
    defaultOptions();
  }, []);

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
          <div className="flex flex-wrap space-x-5">
            <label className="form-label" htmlFor="gender">
              Gender
            </label>
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
          <div>
            <label className="form-label" htmlFor="start_date">
              Siswa
            </label>
            <AsyncSelect
              name="students"
              label="Siswa"
              placeholder="Pilih Siswa"
              isMulti
              defaultOptions={defaultStudentOptions}
              loadOptions={loadOptions}
              value={selectedStudents}
              onChange={handleStudentChange}
              isOptionDisabled={() => selectedStudents.length >= maxStudents}
            />
          </div>
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
    </div>
  );
};

export default Edit;
