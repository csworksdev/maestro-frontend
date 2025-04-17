import React, { useState } from "react";
import Radio from "@/components/ui/Radio";
import Textinput from "@/components/ui/Textinput";
import AsyncSelect from "react-select/async";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";

const AddOrder = ({ params, product }) => {
  const [loadingError, setLoadingError] = useState(null);

  const FormValidationSchema = yup.object({}).required();
  const [inputValue, setInputValue] = useState(params);
  const [selectProductOption, setSelectProductOption] = useState("");

  const {
    register,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  const onSubmit = (newData) => {
    const product = productData.find(
      (item) => item.product_id === selectProductOption
    );
    const trainer = trainerList.find((i) => i.trainer_id === newData.trainer);
    const updatedData = {
      ...data,
      order_id: newData.order_id,
      order_date: DateTime.fromJSDate(newData.order_date).toFormat(
        "yyyy-MM-dd"
      ),
      product: product.product_id,
      promo: newData.promo,
      is_finish: false,
      price: product.price,
      is_paid: newData.is_paid,
      students: selectedStudents.map((student) => ({
        student_id: student.value,
      })),
      start_date: DateTime.fromJSDate(newData.order_date).toFormat(
        "yyyy-MM-dd"
      ),
      trainer: newData.trainer,
      pool: newData.pool,
      package: product.package,
      trainer_percentage: parseInt(trainer.precentage_fee),
      company_percentage: 100 - trainer.precentage_fee,
      branch: isUpdate ? data.branch : newData.branch,
      notes: isUpdate ? data.notes : newData.notes,
      day: newData.day,
      time: newData.jam,
      grand_total: selectedStudents.length * product.price,
    };

    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  const handleProductChange = (e) => {
    setSelectProductOption(e.target.value);
    setInputValue((prevParams) => ({
      ...prevParams,
      product: e.target.value,
      price: product.price,
      grand_total: 1 * product.price,
    }));
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

              selectedStudents.map((student) => {
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
                  item.student = student.value;
                  return item;
                });

                for (let index = 0; index < temp.length; index++) {
                  AddOrderDetail(temp[index], data).then((addres) => {
                    if (addres.status === "success") {
                      console.log("finished");
                    }
                  });
                }
              });

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
        Swal.fire("Error", "Failed to add order.", error);
      });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {loadingError && (
          <p className="error-message">{loadingError.message}</p>
        )}

        <Textinput
          name="pelatih"
          label="Pelatih"
          type="text"
          register={register}
          //   error={errors.promo?.message}
          defaultValue={inputValue.trainer.fullname}
        />
        <Textinput
          name="kolam"
          label="Kolam"
          type="text"
          register={register}
          //   error={errors.promo?.message}
          defaultValue={inputValue.pool.label}
        />
        <Textinput
          name="Hari"
          label="Hari"
          type="text"
          register={register}
          //   error={errors.promo?.message}
          defaultValue={inputValue.day}
        />
        <Textinput
          name="Jam"
          label="Jam"
          type="text"
          register={register}
          //   error={errors.promo?.message}
          defaultValue={inputValue.time}
        />
        <div className="flex flex-wrap space-x-5">
          <label className="form-label" htmlFor="product">
            Product
          </label>
          <div className="flex flex-col">
            {product.map((option) => (
              <Radio
                key={option.product_id}
                label={
                  option.name +
                  " - Rp. " +
                  new Intl.NumberFormat("id-ID").format(option.price)
                }
                name="product"
                value={option.product_id}
                checked={selectProductOption === option.product_id}
                onChange={handleProductChange}
              />
            ))}
          </div>
        </div>
        {/* <div>
          <label className="form-label" htmlFor="students">
            Siswa
          </label>
          <div className="flex gap-3">
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
              className="grow"
            /> */}
        {/* <Button
        className="btn btn-primary text-center p-2 "
        icon="heroicons-outline:user-plus"
        aria-label="Tambah Siswa"
        onClick={() => handleDetail()}
      >
        Tambah Siswa
      </Button> */}
        {/* </div>
          {studentLoadingError && (
            <p className="error-message">{studentLoadingError.message}</p>
          )}
          {errors.students && (
            <p className="error-message">{errors.students.message}</p>
          )}
        </div> */}
        {/* <Select
          name="trainer"
          label="Pelatih"
          placeholder={
            trainerOption.length == 0
              ? "Pelatih tidak tersedia"
              : "Pilih pelatih"
          }
          register={register}
          error={errors.trainer?.message}
          options={trainerOption}
          defaultValue={isUpdate ? data.trainer : ""}
        />
        {trainerLoadingError && (
          <p className="error-message">{trainerLoadingError.message}</p>
        )}
          */}
        <div className="ltr:text-right rtl:text-left space-x-3">
          <div className="btn-group">
            <button type="submit" className="btn btn-dark">
              Buat Order
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddOrder;
