import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import AsyncSelect from "react-select/async";
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
import {
  getSiswaAll,
  getSiswaByBranch,
  searchSiswa,
} from "@/axios/masterdata/siswa";
import { getKolamByBranch } from "@/axios/referensi/kolam";
import { AddOrderDetail } from "@/axios/masterdata/orderDetail";
import { UpdateTrainerSchedule } from "@/axios/masterdata/trainerSchedule";
import { getCabangAll } from "@/axios/referensi/cabang";
import { hari, jam, genderOption } from "@/constant/jadwal-default";
import Textarea from "@/components/ui/Textarea";

const Add = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";
  const [productData, setProductData] = useState([]);
  const [kolamOption, setKolamOption] = useState([]);
  const [productOption, setProductOption] = useState([]);
  const [studentOption, setStudentOption] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [defaultStudentOptions, setDefaultStudentOptions] = useState([]);
  const [trainerOption, setTrainerOption] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);
  const [selectGenderOption, setSelectGenderOption] = useState("L");
  const [selectProductOption, setSelectProductOption] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterTrainerByBranch, setFilterTrainerByBranch] = useState("");
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
  const [maxStudents, setMaxStudents] = useState(0);
  const [trainerList, setTrainerList] = useState([]);
  const [branchOption, setBranchOption] = useState([]);
  const [loadingError, setLoadingError] = useState(null);
  const [studentLoadingError, setStudentLoadingError] = useState(null);
  const [trainerLoadingError, setTrainerLoadingError] = useState(null);
  const [poolNotes, setPoolNotes] = useState(null);

  const FormValidationSchema = yup
    .object({
      // branch: yup.string().required("Branch is required"),
      // pool: yup.string().required("Pool is required"),
      // day: yup.string().required("Day is required"),
      // jam: yup.string().required("Time is required"),
      // start_date: yup.date().required("Start date is required"),
      // students: yup.array().min(1, "At least one student is required"),
      // trainer: yup.string().required("Trainer is required"),
      // product: yup.string().required("Product is required"),
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

  const fillFormFields = (data) => {
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
  };

  useEffect(() => {
    if (isUpdate) {
      fillFormFields(data);
    }
  }, [isUpdate, data, setValue, studentOption]);

  const loadReference = useCallback(async () => {
    try {
      const params = {
        page: 1,
        page_size: 50,
      };
      const branchResponse = await getCabangAll(params);

      const branchOption = branchResponse.data.results.map((item) => ({
        value: item.branch_id,
        label: item.name,
      }));

      setBranchOption(branchOption);

      if (isUpdate) {
        const studentOptions = data.students.map((item) => ({
          value: item.student_id,
          label: item.student_fullname,
        }));
        setStudentOption(studentOptions);
      }

      if (data.pool) {
        setProductOption([]);
        const productResponse = await getProdukPool(data.pool);
        setProductData(productResponse.data.results);
        const productOptions = productResponse.data.results.map((item) => ({
          value: item.product_id,
          label: item.name,
          price: item.price,
        }));
        setProductOption(productOptions);
      }
    } catch (error) {
      setLoadingError(error);
      Swal.fire("Error", "Failed to load reference data.", "error");
    } finally {
      setLoading(false);
    }
  }, [data.pool, isUpdate]);

  useEffect(() => {
    loadReference();
  }, [loadReference]);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    AddOrder(data)
      .then((res) => {
        if (res) {
          Swal.fire("Added!", "Your order has been added.", "success").then(
            () => {
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
              const params = {
                coach: data.trainer,
                day: filterTrainerByDay,
                time: filterTrainerByTime,
                is_free: false,
              };
              UpdateTrainerSchedule(params).then(() => {
                navigate(-1);
              });
            }
          );
        }
      })
      .catch((error) => {
        Swal.fire("Error", "Failed to add order.", "error");
      });
  };

  const handleUpdate = (updatedData) => {
    EditOrder(data.order_id, updatedData)
      .then((res) => {
        if (res.status) {
          Swal.fire("Updated!", "Your order has been updated.", "success").then(
            () => {
              navigate(-1);
              for (let index = 0; index < orderDetail.length; index++) {
                const element = orderDetail[index];
                AddOrderDetail(element)
                  .then((res) => {
                    if (res.status) {
                      console.log(res.status);
                    }
                  })
                  .catch((error) => {
                    Swal.fire(
                      "Error",
                      "Failed to update order details.",
                      "error"
                    );
                  });
              }
            }
          );
        }
      })
      .catch((error) => {
        Swal.fire("Error", "Failed to update order.", "error");
      });
  };

  const onSubmit = (newData) => {
    const product = productData.find(
      (item) => item.product_id === selectProductOption
    );
    const trainer = trainerList.find((i) => i.trainer_id === newData.trainer);
    const updatedData = {
      ...data,
      order_id: newData.order_id,
      order_date: isUpdate
        ? data.order_date
        : DateTime.now().toFormat("yyyy-MM-dd"),
      product: product.product_id,
      promo: newData.promo,
      expire_date: isUpdate
        ? data.expire_date
        : DateTime.fromJSDate(newData.start_date)
            .plus({ days: 60 })
            .toFormat("yyyy-MM-dd"),
      is_finish: newData.is_finish,
      price: product.price,
      is_paid: newData.is_paid,
      students: selectedStudents.map((student) => ({
        student_id: student.value,
      })),
      start_date: isUpdate
        ? data.start_date
        : DateTime.fromJSDate(newData.start_date).toFormat("yyyy-MM-dd"),
      trainer: newData.trainer,
      pool: newData.pool,
      package: product.package,
      trainer_percentage: parseInt(trainer.precentage_fee),
      company_percentage: 100 - trainer.precentage_fee,
      branch: isUpdate ? data.branch : newData.branch,
      notes: isUpdate ? data.notes : newData.notes,
      total: product.price * selectedStudents.length,
    };

    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  const handleBranchChange = async (e) => {
    const branch_id = e.target.value;
    setFilterTrainerByBranch(branch_id);
    try {
      const params = {
        page: 1,
        page_size: 50,
      };
      const kolamResponse = await getKolamByBranch(branch_id, params);
      const studentResponse = await getSiswaByBranch(branch_id, params);
      const kolamOption = kolamResponse.data.results.map((item) => ({
        value: item.pool_id,
        label: item.name,
        notes: item.notes,
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
      setDefaultStudentOptions(studentOptions.slice(0, 10));

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
      setLoadingError(error);
      Swal.fire("Error", "Failed to load branch data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (e) => {
    setSelectProductOption(e.target.value);
    const findData = productData.find(
      (item) => item.product_id === e.target.value
    );
    setMaxStudents(findData.max_student);
    createDetail(findData);
  };

  const handlePoolChange = async (e) => {
    setProductOption([]);
    try {
      const productResponse = await getProdukPool(e.target.value);
      setProductData(productResponse.data.results);
      const productOptions = productResponse.data.results.map((item) => ({
        value: item.product_id,
        label: item.name,
        price: item.price,
      }));
      setProductOption(productOptions);
      setFilterTrainerByPool(e.target.value);
    } catch (error) {
      setLoadingError(error);
      Swal.fire("Error", "Failed to load pool data.", "error");
    }
    setPoolNotes("");
    const pool_notes = kolamOption.find(
      (item) => item.value === e.target.value
    );
    setPoolNotes(pool_notes.notes);
  };

  const handleGenderOption = (e) => {
    setSelectGenderOption(e.target.value);
    setFilterTrainerByGender(e.target.value);
  };

  const handleHariOption = (e) => {
    setFilterTrainerByDay(e.target.value);
  };

  const handleJamOption = (e) => {
    setFilterTrainerByTime(e.target.value);
  };

  useEffect(() => {
    setFilterTrainerParams((prevParams) => ({
      ...prevParams,
      pool_id: filterTrainerByPool,
    }));
    setValue("price", "");
    setValue("product", "");
  }, [filterTrainerByPool, setValue]);

  useEffect(() => {
    setFilterTrainerParams((prevParams) => ({
      ...prevParams,
      gender: filterTrainerByGender,
      day: filterTrainerByDay,
      time: filterTrainerByTime,
    }));
  }, [filterTrainerByGender, filterTrainerByDay, filterTrainerByTime]);

  useEffect(() => {
    if (filterTrainerByBranch) {
      const filterTrainer = async () => {
        setTrainerOption([]);
        try {
          const trainerResponse = await FindAvailableTrainer(
            filterTrainerParams
          );
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
        } catch (error) {
          setTrainerLoadingError(error);
          Swal.fire("Error", "Failed to load trainers.", "error");
        }
      };
      filterTrainer();
    }
  }, [
    filterTrainerParams,
    filterTrainerByBranch,
    isUpdate,
    data.trainer,
    data.trainer_name,
  ]);

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
      temp.push({
        ...baseOrderDetail,
        meet: index,
      });
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
      setStudentLoadingError(error);
      Swal.fire("Error", "Failed to load student options.", "error");
      callback([]);
    }
  };

  const StudentDefaultOptions = async () => {
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
      setStudentLoadingError(error);
      Swal.fire("Error", "Failed to load default students.", "error");
    }
  };

  useEffect(() => {
    StudentDefaultOptions();
  }, []);

  if (loading && isUpdate) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-5">
      <Card title={`${isUpdate ? "Update" : "Add"} Order`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {loadingError && (
            <p className="error-message">{loadingError.message}</p>
          )}
          <Select
            name="branch"
            label="Cabang"
            placeholder="Pilih Cabang"
            register={register}
            error={errors.branch?.message}
            options={branchOption}
            defaultValue={isUpdate ? data.branch : ""}
            onChange={handleBranchChange}
          />
          <Select
            name="pool"
            label="Kolam"
            placeholder="Pilih Kolam"
            register={register}
            error={errors.pool?.message}
            options={kolamOption}
            defaultValue={isUpdate ? data.pool : ""}
            onChange={handlePoolChange}
          />
          <Textarea
            name="notes"
            label="Catatan"
            type="text"
            register={register}
            placeholder=""
            value={poolNotes}
            disabled
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              name="day"
              label="Hari"
              placeholder="Pilih Hari"
              register={register}
              error={errors.day?.message}
              options={hari}
              defaultValue={"Senin"}
              onChange={handleHariOption}
            />
            <Select
              name="jam"
              label="Jam"
              placeholder="Pilih Jam"
              register={register}
              error={errors.jam?.message}
              options={jam}
              defaultValue={"09.00"}
              onChange={handleJamOption}
            />
          </div>
          <div className="flex flex-wrap space-x-5">
            <label className="form-label" htmlFor="gender">
              Gender Pelatih
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
          <div className="flex flex-wrap space-x-5">
            <label className="form-label" htmlFor="product">
              Product
            </label>
            <div className="flex flex-col">
              {productOption.map((option) => (
                <Radio
                  key={option.value}
                  label={
                    option.label +
                    " - Rp. " +
                    new Intl.NumberFormat("id-ID").format(option.price)
                  }
                  name="product"
                  value={option.value}
                  checked={selectProductOption === option.value}
                  onChange={handleProductChange}
                />
              ))}
            </div>
          </div>
          <div className="hidden">
            <label className="form-label" htmlFor="order_date">
              Tanggal Order
            </label>
            <Flatpickr
              defaultValue={
                isUpdate
                  ? data.order_date
                  : DateTime.fromJSDate(DateTime.now()).toFormat("yyyy-MM-dd")
              }
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
              defaultValue={
                isUpdate
                  ? data.start_date
                  : DateTime.fromJSDate(DateTime.now()).toFormat("yyyy-MM-dd")
              }
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
            error={errors.promo?.message}
            defaultValue={isUpdate ? data.promo : ""}
          />
          <div>
            <label className="form-label" htmlFor="students">
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
            {studentLoadingError && (
              <p className="error-message">{studentLoadingError.message}</p>
            )}
            {errors.students && (
              <p className="error-message">{errors.students.message}</p>
            )}
          </div>
          <Select
            name="trainer"
            label="Pelatih"
            placeholder="Pilih pelatih"
            register={register}
            error={errors.trainer?.message}
            options={trainerOption}
            defaultValue={isUpdate ? data.trainer : ""}
          />
          {trainerLoadingError && (
            <p className="error-message">{trainerLoadingError.message}</p>
          )}
          <div className="ltr:text-right rtl:text-left space-x-3">
            <div className="btn-group">
              <button type="button" className="btn" onClick={handleCancel}>
                Batal
              </button>
              <button type="submit" className="btn btn-dark">
                {isUpdate ? "Update" : "Add"} Order
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Add;
