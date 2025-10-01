import React, { useEffect, useReducer, useState } from "react";
import Textinput from "@/components/ui/Textinput";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Checkbox from "@/components/ui/Checkbox";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icons from "@/components/ui/Icon";
import { DateTime } from "luxon";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  AddSiswa,
  CheckDuplicateSiswa,
  getSiswaAll,
  searchSiswa,
} from "@/axios/masterdata/siswa";
import Loading from "@/components/Loading";
import { useSelector } from "react-redux";
import { AddOrderDetail } from "@/axios/masterdata/orderDetail";
import { AddOrderScheduleV2 } from "@/axios/schedule/orderSchedule";
import { AddOrder } from "@/axios/masterdata/order";
import { XenditCreatePaymentLink } from "@/axios/xendit";
import { toProperCase, toNormalizePhone } from "@/utils";
import { generateExternalId } from "@/utils/xendit-uuid";
import InputGroup from "@/components/ui/InputGroup";
import Flatpickr from "react-flatpickr";
import AsyncSelect from "react-select/async";
import Swal from "sweetalert2";

// status registrasi
const allStatus = [
  {
    value: "newreg",
    label: "Baru",
    price: 120000,
  },
  {
    value: "newregcikarang",
    label: "Baru Cikarang",
    price: 110000,
  },
  {
    value: "extend",
    label: "Perpanjangan",
    price: 0,
  },
  {
    value: "freereg",
    label: "Free",
    price: 0,
  },
  {
    value: "combo",
    label: "Combo",
    price: 300000,
  },
];

const AddJadwal = ({
  params,
  product,
  branch,
  isModalShow,
  reloadDataMaster,
}) => {
  // const [loadingError, setLoadingError] = useState(null);
  const FormValidationSchema = yup
    .object({
      order_date: yup.date().when("$isInvoice", {
        is: true,
        then: (schema) => schema.required("tanggal is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
    })
    .required();
  const [inputValue, setInputValue] = useState(params);
  const [selectedProduct, setSelectedProduct] = useState([]); // Initialize as an empty array for product objects
  const [isLoadingCheckDuplicate, setIsLoadingCheckDuplicate] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const { user_id, roles } = useSelector((state) => state.auth.data);
  const [keterangan, setKeterangan] = useState(
    "test Privat 1 4x pertemuan A.n Anaknya Chandra ( Lagi ngetest ) (C.Aryaaa)"
  );
  const [parent, setParent] = useState([]);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isSplitInvoice, setIsSplitInvoice] = useState(false);
  const [isInvoice, setIsInvoice] = useState(false);

  // fetch old students
  const [defaultStudentOptions, setDefaultStudentOptions] = useState([]);
  const [studentLoadingError, setStudentLoadingError] = useState(null);
  const [maxStudents, setMaxStudents] = useState(5);
  const [selectedOldStudents, setSelectedOldStudents] = useState([]);

  const {
    register,
    setValue,
    formState: { errors },
    handleSubmit,
    control,
    reset,
    trigger,
    setError,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
    defaultValues: {
      students: [
        {
          student_id: "",
          fullname: "",
          nickname: "",
          gender: "",
          parent: "",
          phone: "",
          address: "-",
          pob: "",
          dob: "",
          branch: branch,
          reg_stat: "",
          istrial: false,
        },
      ],
    },
  });

  // form repeater
  const { fields, append, remove } = useFieldArray({
    control,
    name: "students",
  });

  // #region Handle paste
  const [formList, setFormList] = useState([]);

  const handlePaste = async () => {
    try {
      setIsLoadingCheckDuplicate(true);

      const pastedData = await navigator.clipboard.readText();
      const rows = pastedData.trim().split("\n");

      const parsedRows = rows.map((row) => {
        const values = row.split("\t");
        return {
          student_id: "",
          fullname: toProperCase(String(values[2]).trim()) || "",
          nickname: toProperCase(String(values[3]).trim()) || "",
          gender: String(values[5]).trim() === "Laki-laki" ? "L" : "P",
          parent:
            values[4].length < 2
              ? toProperCase(String(values[2]).trim())
              : toProperCase(String(values[4]).trim()),
          phone: values[11] || "",
          address: values[10] || "-",
          pob: values[6] || "",
          dob: values[7]
            ? DateTime.fromFormat(values[7].trim(), "M/d/yyyy").toFormat(
                "yyyy-MM-dd"
              )
            : "",
          branch: branch,
          reg_stat: "",
          istrial: false,
        };
      });

      let data = parsedRows.map((item) => ({
        fullname: item.fullname,
        phone: item.phone,
      }));

      const check = await CheckDuplicateSiswa({ data }).then(
        (res) => res.data.results
      );

      let oldStudents = [];
      for (let index = 0; index < check.length; index++) {
        if (check[index].student_id !== null) {
          parsedRows[index].student_id = check[index].student_id;
          parsedRows[index].reg_stat = "extend";
          parsedRows[index].fullname = check[index].fullname;
          oldStudents.push({
            student_id: check[index].student_id,
            is_new: parsedRows[index].reg_stat === "extend" ? false : true,
            fullname: check[index].fullname,
          });
        } else {
          parsedRows[index].reg_stat = "newreg";
          parsedRows[index].fullname = check[index].input_name;
        }
      }

      // Buat parent unik baru
      const uniqueParentsMap = new Map();
      parsedRows.forEach((item) => {
        const parentName =
          item.parent && (item.parent !== "-" || item.parent !== "")
            ? item.parent
            : item.fullname;

        const key = `${parentName}-${item.phone}`;
        if (item.phone && !uniqueParentsMap.has(key)) {
          uniqueParentsMap.set(key, {
            name: toProperCase(parentName),
            phone: item.phone,
            keterangan: "",
            products: [],
          });
        }
      });

      const parentList = Array.from(uniqueParentsMap.values());

      // 🟢 GABUNGKAN dengan parent lama
      setParent((prev) => {
        const prevMap = new Map(prev.map((p) => [`${p.name}-${p.phone}`, p]));
        parentList.forEach((p) => prevMap.set(`${p.name}-${p.phone}`, p));
        return Array.from(prevMap.values());
      });

      // 🟢 GABUNGKAN student lama dengan yang baru
      setSelectedStudents((prev) => [...prev, ...oldStudents]);

      // 🟢 GABUNGKAN form list lama dengan baru
      setFormList((prev) => [...prev, ...parsedRows]);

      // 🟢 Tambah ke react-hook-form
      parsedRows.forEach((row) => {
        append({
          student_id: row.student_id,
          fullname: row.fullname,
          nickname: row.nickname,
          gender: row.gender,
          parent: row.parent,
          phone: row.phone,
          address: row.address,
          pob: row.pob,
          dob: row.dob,
          reg_stat: row.reg_stat,
          istrial: false,
        });

        setValue(
          "namapelanggan",
          row.parent === "-" || row.parent === "" ? row.fullname : row.parent
        );
        setValue("phonepelanggan", toNormalizePhone(row.phone));
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingCheckDuplicate(false);
    }
  };

  // #endregion handle paste

  // #region Submit form
  // submit student
  const submitNewStudent = async () => {
    const promises = formList
      .filter((item) => item.student_id === "")
      .map(async (item) => {
        const datasiswa = {
          fullname: item.fullname,
          nickname: item.nickname,
          gender: item.gender ?? isGender,
          parent: item.parent,
          phone: item.phone,
          address: item.address ?? "-",
          dob: item.dob,
          pob: item.pob,
          branch: item.branch,
        };

        const res = await AddSiswa(datasiswa);

        setFormList((prev) =>
          prev.map((x) =>
            x.fullname === res.data.message.fullname
              ? { ...x, student_id: res.data.message.student_id }
              : x
          )
        );

        return res.data.message;
      });

    return await Promise.all(promises);
  };

  const createInvoice = async (newData, students) => {
    try {
      const external_id = generateExternalId();
      var is_finish = 0;

      for (const product of selectedProduct) {
        for (let index = 0; index < product.qty; index++) {
          const updatedData = {
            package: product.package,
            price: product.price,
            product: product.product_id,
            trainer: inputValue.trainer.trainer_id,
            pool: inputValue.pool.value,
            trainer_percentage: parseInt(inputValue.trainer_percentage),
            company_percentage: inputValue.company_percentage,
            branch: inputValue.branch,
            notes: "-",
            day: inputValue.day,
            time: inputValue.time,
            grand_total:
              (product.package_name === "trial"
                ? newData.students.filter((s) => s.istrial).length
                : newData.students.length) * product.price,
            create_by: user_id,
            created_at: DateTime.now(),
            is_finish: false,
            is_paid: isInvoice ? "pending" : "settled",
            start_date: DateTime.now().plus({ days: 7 }).toFormat("yyyy-MM-dd"),
            order_date: isInvoice
              ? DateTime.now().toFormat("yyyy-MM-dd")
              : DateTime.fromJSDate(newData.order_date).toFormat("yyyy-MM-dd"),
            students:
              product.package_name === "trial"
                ? newData.updatedStudents
                    .filter((s) => s.istrial)
                    .map((student) => ({
                      student_id: student.student_id,
                    }))
                : newData.updatedStudents.map((student) => ({
                    student_id: student.student_id,
                  })),
            invoice_id: external_id,
          };

          const res = await AddOrder(updatedData);

          if (res) {
            // ⬇️ KUMPULKAN SEMUA PROMISE DARI AddOrderDetail
            const orderDetailPromises = [];

            updatedData.students.forEach((student) => {
              for (let i = 0; i < product.meetings; i++) {
                const temp = {
                  order: res.data.order_id,
                  day: inputValue.day,
                  time: inputValue.time,
                  price_per_meet: Math.floor(
                    (product.price * parseInt(inputValue.trainer_percentage)) /
                      100 /
                      product.meetings
                  ),
                  schedule_date: DateTime.now()
                    .plus({ days: 7 * (i + 1) })
                    .toFormat("yyyy-MM-dd"),
                  student: student.student_id,
                  meet: i + 1,
                  is_presence: false,
                };

                orderDetailPromises.push(AddOrderDetail(temp)); // tanpa await
              }
            });

            await Promise.all(orderDetailPromises); // baru dijalankan bareng-bareng

            // ✅ BARU LANJUTKAN KE AddOrderScheduleV2
            const params = {
              branch: inputValue.branch,
              pool: inputValue.pool.value,
              trainer: inputValue.trainer.trainer_id,
              order: res.data.order_id, // ini typo sebelumnya: res.order_id (harusnya res.data.order_id)
              day: inputValue.day,
              time: inputValue.time,
              is_free: true,
            };
            let data = await AddOrderScheduleV2(params);
            if (data.data.status === "success") {
              is_finish += 1;
            }
          }
        }

        if (isInvoice) {
          if (is_finish === selectedProduct.length) {
            if (!isSplitInvoice) {
              let paramxendit = {
                external_id: external_id,
                amount:
                  selectedProduct.reduce(
                    (sum, p) =>
                      sum + p.qty * selectedStudents?.length * p.sellprice,
                    0
                  ) +
                  Object.values(grouped).reduce(
                    (sum, value) => sum + value.total,
                    0
                  ),
                description: newData.keteranganpelanggan,
                customer_name: newData.namapelanggan,
                customer_phone: newData.phonepelanggan,
                items: [
                  ...selectedProduct.map((p) => ({
                    name: p.name,
                    quantity: p.qty,
                    price: parseInt(p.sellprice, 10),
                  })),
                  ...Object.entries(grouped)
                    .filter(([key]) => key !== "extend")
                    .map(([key, value]) => ({
                      name: "Registrasi " + value.count,
                      quantity: value.count,
                      price: parseInt(value.total, 10),
                    })),
                ],
              };
              await XenditCreatePaymentLink(paramxendit).then((res) =>
                reloadDataMaster()
              );
            } else {
              await Promise.all(
                parent.map(async (item, idx) => {
                  let paramxendit = {
                    external_id: external_id,
                    amount: parseInt(newData.splitCustomers[idx].tagihan),
                    description: newData.splitCustomers[idx].keterangan,
                    customer_name: newData.splitCustomers[idx].name,
                    customer_phone: newData.splitCustomers[idx].phone, // fix typo
                    items: [
                      ...selectedProduct.map((p) => ({
                        name: p.name,
                        quantity: p.qty,
                        price: parseInt(p.sellprice, 10),
                      })),
                      ...Object.entries(grouped)
                        .filter(([key]) => key !== "extend")
                        .map(([key, value]) => ({
                          name: "Registrasi " + value.count,
                          quantity: value.count,
                          price: parseInt(value.total, 10),
                        })),
                    ],
                  };

                  await XenditCreatePaymentLink(paramxendit);
                })
              );

              reloadDataMaster(); // dipanggil setelah semua XenditCreatePaymentLink selesai
            }
          }
        }
        // else {

        // }
      }
    } catch (error) {
      console.error(error);
    } finally {
      reloadDataMaster();
    }
  };

  const onSubmit = async (newData) => {
    console.log(newData);
    try {
      const newStudents = await submitNewStudent();
      const allStudents = [...selectedStudents, ...newStudents];

      // Buat updated students dengan student_id baru:
      const updatedStudents = newData.students.map((x) => {
        const found = allStudents.find((s) => s.fullname === x.fullname);
        return found ? { ...x, student_id: found.student_id } : x;
      });

      setSelectedStudents(allStudents); // update state global

      await createInvoice({ ...newData, updatedStudents });
    } catch (err) {
      console.error("Gagal submit atau membuat invoice:", err);
    }
  };

  // #endregion submit form

  // #region Handle Product
  const handleProductSelectionChange = (option) => {
    const currentProductId = option.product_id;
    const isSelected = selectedProduct.some(
      (p) => p.product_id === currentProductId
    );
    if (isSelected) {
      setSelectedProduct(
        selectedProduct.filter((p) => p.product_id !== currentProductId)
      );
    } else {
      setSelectedProduct([
        ...selectedProduct,
        {
          product_id: currentProductId,
          name: option.name,
          price: option.price,
          sellprice: option.sellprice,
          meetings: option.meetings,
          package: option.package,
          package_name: option.package_name,
          qty: 0,
        },
      ]);
    }
  };

  const handleProductDisable = (package_name) => {
    var jumlahSiswa = formList.length;
    if (jumlahSiswa === 1)
      switch (package_name) {
        case "trial":
          return false;
        case "Privat 1":
          return false;
        case "Hydrotherapy":
          return false;
        case "Baby Swim & Spa":
          return false;
        default:
          return true;
      }
    else if (jumlahSiswa === 2) {
      switch (package_name) {
        case "trial":
          return false;
        case "Privat 2":
          return false;
        default:
          return true;
      }
    } else if (jumlahSiswa >= 3 && jumlahSiswa <= 5) {
      switch (package_name) {
        case "trial":
          return false;
        case "Group":
          return false;
        default:
          return true;
      }
    } else return true;
  };

  // #endregion Handle Product

  const handleQtyChange = (productId, rawValue) => {
    setSelectedProduct((prevSelected) =>
      prevSelected.map((p) =>
        p.product_id === productId
          ? { ...p, qty: parseInt(rawValue, 10) || 0 }
          : p
      )
    );
  };

  // useEffect to manage the trial product in selectedProduct based on formList
  // Untuk update trial product di selectedProduct
  useEffect(() => {
    const trialStudentCount = formList.filter(
      (student) => student.istrial
    ).length;
    const trialProductDefinition = product.find(
      (p) => p.package_name && p.package_name.toLowerCase() === "trial"
    );

    if (!trialProductDefinition) return;

    setSelectedProduct((prevSelectedProducts) => {
      const currentTrialProductInSelection = prevSelectedProducts.find(
        (p) => p.product_id === trialProductDefinition.product_id
      );
      const otherSelectedProducts = prevSelectedProducts.filter(
        (p) => p.product_id !== trialProductDefinition.product_id
      );

      if (trialStudentCount > 0) {
        const newTrialProductEntry = {
          product_id: trialProductDefinition.product_id,
          name: trialProductDefinition.name,
          price: trialProductDefinition.price,
          sellprice: trialProductDefinition.sellprice,
          qty: trialStudentCount,
          meetings: trialProductDefinition.meetings,
          package: trialProductDefinition.package,
          package_name: trialProductDefinition.package_name,
        };

        if (
          currentTrialProductInSelection &&
          currentTrialProductInSelection.qty === trialStudentCount
        ) {
          return prevSelectedProducts;
        }
        return [...otherSelectedProducts, newTrialProductEntry];
      } else {
        if (currentTrialProductInSelection) {
          return otherSelectedProducts;
        }
        return prevSelectedProducts;
      }
    });
  }, [formList, product, setSelectedProduct]);

  useEffect(() => {
    if (selectedProduct.length === 0 || formList.length === 0) {
      return;
    }

    // Kelompokkan siswa berdasarkan parent
    const groupedByParent = formList.reduce((acc, student) => {
      const parentName = student.parent || "Unknown Parent";
      if (!acc[parentName]) acc[parentName] = [];
      acc[parentName].push(student); // Simpan objek, bukan hanya fullname
      return acc;
    }, {});

    // Bangun deskripsi per parent
    const deskripsiPerParent = Object.entries(groupedByParent).map(
      ([parentName, studentList]) => {
        const parentProper = toProperCase(parentName);

        const produkDesc = selectedProduct
          .map((p) => {
            const isTrial = p.package_name.toLowerCase().includes("trial");

            // Filter siswa berdasarkan apakah produk trial
            const filteredStudents = studentList
              .filter((s) => (isTrial ? s.istrial : true))
              .map((s) => toProperCase(s.fullname));

            if (filteredStudents.length === 0) return null; // Lewati jika tidak ada siswa

            const studentsProper = filteredStudents.join(", ");

            return ` (${p.name}) ${toProperCase(p.package_name)} ${
              p.meetings
            }x Pertemuan A.n ${studentsProper} (${toProperCase(
              inputValue.trainer.fullname
            )})`;
          })
          .filter(Boolean) // Buang produk yang tidak punya siswa relevan
          .join("\n");

        return `Orang Tua: ${parentProper}\n${produkDesc}`;
      }
    );

    // Gabungkan semua deskripsi per parent dengan baris kosong sebagai pemisah
    const finalDeskripsi = deskripsiPerParent.join("\n\n");

    // Update form field splitCustomers[n].keterangan untuk tiap parent jika kamu pakai splitInvoice
    if (isSplitInvoice) {
      Object.entries(groupedByParent).forEach(
        ([parentName, studentList], idx) => {
          let totalbayar = 0;

          // total of registrasi
          let total_reg = 0;
          studentList.forEach((element) => {
            const x = allStatus.find((s) => s.value === element.reg_stat);
            total_reg += parseInt(x?.price || 0);
          });

          // total of trial
          let total_trial = selectedProduct
            .filter((p) => p.package_name === "trial")
            .reduce((acc, x) => {
              let filteredStudents = studentList.filter(
                (sl) => sl.istrial === true
              );
              if (filteredStudents.length === 0) return acc;
              else return acc + x.sellprice * filteredStudents.length;
            }, 0);

          // total of main product
          let total_main = selectedProduct
            .filter((p) => p.package_name !== "trial")
            .reduce((acc, x) => {
              return acc + x.sellprice * studentList.length;
            }, 0);

          totalbayar =
            parseInt(total_reg) + parseInt(total_trial) + parseInt(total_main);
          // const numericValue = new Intl.NumberFormat("id-ID").format(
          //   totalbayar
          // );

          const produkDesc = selectedProduct
            .map((p) => {
              const isTrial = p.package_name.toLowerCase().includes("trial");
              let filteredStudents = studentList.filter((s) =>
                isTrial ? s.istrial : true
              );

              if (filteredStudents.length === 0) return null;

              const studentsProper = filteredStudents
                .map((item) => {
                  return item.fullname;
                })
                .join(", ");

              return `${toProperCase(p.package_name)} ${
                p.meetings
              }x Pertemuan A.n ${studentsProper} (${toProperCase(
                inputValue.trainer.fullname
              )})`;
            })
            .filter(Boolean)
            .join("\n");

          setValue(`splitCustomers[${idx}].tagihan`, totalbayar, {
            shouldValidate: true,
            shouldDirty: true,
          });

          setValue(`splitCustomers[${idx}].keterangan`, produkDesc, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      );
    } else {
      setValue("keteranganpelanggan", finalDeskripsi);
    }
  }, [selectedProduct, formList, inputValue.trainer, setValue, isSplitInvoice]);

  useEffect(() => {
    const uniqueParentsMap = new Map();

    formList.forEach((item) => {
      const parentName =
        item.parent && (item.parent !== "-" || item.parent !== "")
          ? item.parent
          : item.fullname;

      const key = `${parentName}-${item.phone}`;
      if (item.phone && !uniqueParentsMap.has(key)) {
        uniqueParentsMap.set(key, {
          name: toProperCase(parentName),
          phone: item.phone,
          keterangan: "",
          products: [],
        });
      }
    });

    const parentList = Array.from(uniqueParentsMap.values());
    setParent(parentList);
    // setListParent(parsedRows);
  }, [formList]);

  // tarik data khusus Siswa
  // #region
  const handleStudentChange = (selectedOptions) => {
    if (selectedOptions.length <= maxStudents) {
      setSelectedOldStudents(selectedOptions);
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
        parent: student.parent,
        phone: student.phone,
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
        parent: student.parent,
        phone: student.phone,
      }));
      setDefaultStudentOptions(students);
    } catch (error) {
      setStudentLoadingError(error);
      Swal.fire("Error", "Failed to load default students.", "error");
    }
  };

  const addOldStudent = () => {
    selectedOldStudents.length > 0 &&
      setSelectedStudents((prev) => [...prev, ...selectedOldStudents]);

    const parsedRows = selectedOldStudents.map((row) => {
      append({
        student_id: row.value,
        fullname: row.label,
        parent: row.parent,
        phone: row.phone,
        reg_stat: "extend",
      });

      setValue(
        "namapelanggan",
        row.parent === "-" || row.parent === "" ? row.fullname : row.parent
      );
      setValue("phonepelanggan", toNormalizePhone(row.phone));

      return {
        student_id: row.value,
        fullname: row.label,
        parent: row.parent,
        phone: row.phone,
        reg_stat: "extend",
      };
    });

    // 🟢 GABUNGKAN form list lama dengan baru
    setFormList((prev) => [...prev, ...parsedRows]);
    setSelectedOldStudents([]);
  };

  useEffect(() => {
    StudentDefaultOptions();
  }, []);

  // #endregion

  const handleRegStatChange = (fullname, kolom, value) => {
    // Update local formList state
    setFormList((prevSelected) =>
      prevSelected.map((p) =>
        p.fullname === fullname
          ? {
              ...p,
              [kolom]: value,
              // If 'istrial' is being set to true, other products might need adjustment (e.g. if trial is exclusive)
              // For now, this just updates the specific field. The useEffect above handles trial product.
            }
          : p
      )
    );

    // Update react-hook-form's state
    const studentIndexInRHF = fields.findIndex(
      (field) => field.fullname === fullname
    );
    if (studentIndexInRHF !== -1) {
      const fieldNameInRHF = `students[${studentIndexInRHF}].${kolom}`;
      setValue(fieldNameInRHF, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const grouped = formList.reduce((acc, curr) => {
    const key = curr.reg_stat;
    const statusMeta = allStatus.find((s) => s.value === key);

    if (!acc[key]) {
      acc[key] = {
        label: statusMeta?.label || key,
        count: 0,
        total: 0,
      };
    }

    acc[key].count += 1;
    acc[key].total += statusMeta?.price || 0;

    return acc;
  }, {});

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit, (errors) =>
          console.log("Form errors:", errors)
        )}
        className="space-y-4"
      >
        {/* {loadingError && (
          <p className="error-message">{loadingError.message}</p>
        )} */}
        <Card
          subtitle={
            <div className="flex flex-col">
              <span>
                Pelatih : <b>{inputValue.trainer.fullname}</b>
              </span>
              <span>
                Kolam : <b>{inputValue.pool.label}</b>
              </span>
              <span>
                Hari : <b>{inputValue.day}</b>
              </span>
              <span>
                Jam : <b>{inputValue.time}</b>
              </span>
            </div>
          }
          headerslot={
            <div className="flex flex-row gap-5 items-start">
              <div className="flex p-3 border-2 border-green-500 border-solid rounded-md h-auto">
                <Checkbox
                  name="buatXendit"
                  label={"Buat Xendit"}
                  value={isInvoice}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsInvoice(checked);

                    if (checked) {
                      // kalau buat xendit diaktifkan → set tanggal order ke hari ini
                      setValue("order_date", new Date(), {
                        shouldValidate: true,
                      });
                    } else {
                      // kalau tidak buat xendit → hapus nilainya supaya nggak divalidasi
                      setValue("order_date", null, { shouldValidate: true });
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-[auto_minmax(0,400px)] gap-4 items-center border border-blue-400 p-4 rounded">
                <label>Siswa Baru</label>
                <Button
                  text="Siswa"
                  icon="heroicons-outline:plus"
                  className="btn-dark w-full max-w-[100px]"
                  onClick={() => handlePaste()}
                  disabled={isLoadingCheckDuplicate}
                />

                <div className="col-span-2 border-t border-gray-300 my-1"></div>
                <label>Siswa Lama</label>
                <div className="flex gap-3">
                  <AsyncSelect
                    name="students"
                    label="Siswa"
                    placeholder="Pilih Siswa"
                    isMulti
                    defaultOptions={defaultStudentOptions}
                    loadOptions={loadOptions}
                    value={selectedOldStudents}
                    onChange={handleStudentChange}
                    isOptionDisabled={() =>
                      selectedOldStudents.length >= maxStudents
                    }
                    className="grow"
                  />
                  {selectedOldStudents.length >= 1 &&
                  selectedOldStudents.length <= 5 ? (
                    <Button
                      icon="heroicons-outline:plus"
                      className="btn-dark w-full max-w-[50px] h-full max-h-[40px]"
                      onClick={() => addOldStudent()}
                      disabled={isLoadingCheckDuplicate}
                    />
                  ) : null}
                </div>
                {studentLoadingError && (
                  <p className="error-message">{studentLoadingError.message}</p>
                )}
                {errors.students && (
                  <p className="error-message">{errors.students.message}</p>
                )}
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {/* tanggal order akan muncul jika is invoice di centang */}
            {!isInvoice ? (
              <Card bodyClass="p-3">
                <div className="flex flex-row items-center">
                  <label className="form-label basis-1/5" htmlFor="order_date">
                    Tanggal Order
                  </label>
                  <Controller
                    name="order_date"
                    control={control}
                    defaultValue={null}
                    render={({ field }) => (
                      <Flatpickr
                        {...field}
                        options={{
                          disableMobile: true,
                          allowInput: true,
                          altInput: true,
                          altFormat: "d F Y",
                        }}
                        className="form-control py-2 bg-white basis-1/4"
                        onChange={(date) => field.onChange(date[0])}
                      />
                    )}
                  />
                </div>
              </Card>
            ) : null}
            <div className="grid grid-cols-[auto_auto] gap-5 mb-5">
              {/* Product Section */}
              {product && product.length !== 0 && (
                // <ProductSection
                //   product={product}
                //   handleProductDisable={handleProductDisable}
                //   selectedProduct={selectedProduct}
                //   handleQtyChange={handleQtyChange}
                //   handleProductSelectionChange={handleProductSelectionChange}
                //   control={control}
                //   register={register}
                // />
                <div className="flex flex-col">
                  {/* Header for Product Section */}
                  <div className="grid grid-cols-[1fr_100px] gap-5">
                    <label className="form-label" htmlFor="product">
                      Product
                    </label>
                    <label className="form-label" htmlFor="jumlah">
                      Jumlah Paket
                    </label>
                  </div>
                  {/* Product Rows */}
                  <div className="grid grid-cols-[1fr_100px] gap-3 mb-5 items-center">
                    {product.map((option, i) => {
                      const isDisabled = handleProductDisable(
                        option.package_name
                      );
                      //  ||
                      // option.package_name.toLowerCase() === "trial";

                      if (isDisabled) return null;
                      return (
                        <React.Fragment
                          key={`product-item-${option.product_id}`}
                        >
                          <Checkbox
                            name="product"
                            label={`${option.name.toLowerCase()} - Rp. ${new Intl.NumberFormat(
                              "id-ID"
                            ).format(option.sellprice)}`}
                            value={selectedProduct.some(
                              (p) => p.product_id === option.product_id
                            )}
                            onChange={() => {
                              // This onChange is for non-trial products.
                              // Trial product selection is handled automatically by istrial checkboxes.
                              if (
                                option.package_name.toLowerCase() !== "trial"
                              ) {
                                if (
                                  selectedProduct.some(
                                    (p) => p.product_id === option.product_id
                                  )
                                )
                                  handleQtyChange(option.product_id, 0);
                              }
                              handleProductSelectionChange(option);
                            }}
                            disabled={
                              handleProductDisable(option.package_name) ||
                              option.package_name.toLowerCase() === "trial"
                            }
                          />
                          <Textinput
                            isMask
                            type="text"
                            id={`qty${i}`}
                            register={register}
                            placeholder="0"
                            className="text-right"
                            options={{ numeral: true, blocks: [1] }}
                            value={
                              selectedProduct
                                .find((p) => p.product_id === option.product_id)
                                ?.qty?.toString() || "0"
                            }
                            defaultValue={1}
                            disabled={
                              !selectedProduct.some(
                                (p) => p.product_id === option.product_id
                              )
                              // || option.package_name.toLowerCase() === "trial" // Also disable qty input for trial product
                            }
                            onChange={(e) => {
                              let raw = e.target.rawValue || "0";
                              let val = parseInt(raw, 10);

                              // Batas nilai min dan max
                              const min = 1;
                              const max = 10; //formList.length;

                              // Koreksi nilai agar sesuai dengan batasan
                              if (val < min) val = min;
                              if (val > max) val = max;

                              handleQtyChange(
                                option.product_id,
                                val.toString()
                              );
                            }}
                          />
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Siswa Section */}
              {fields && fields.length !== 0 && (
                // <StudentSection
                //   isLoadingCheckDuplicate={isLoadingCheckDuplicate}
                //   fields={fields}
                //   control={control}
                //   register={register}
                //   allStatus={allStatus}
                //   handleRegStatChange={handleRegStatChange}
                //   formList={formList}
                //   remove={remove}
                //   setFormList={setFormList}
                //   setSelectedProduct={setSelectedProduct}
                //   forceUpdate={forceUpdate}
                // />
                <div className="flex flex-col space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-[2fr_1fr_auto_auto] gap-5 items-center">
                    <span>Nama Siswa</span>
                    <span>Registrasi</span>
                    <span className="text-center">Trial</span>
                    <span>Delete</span>
                  </div>

                  {isLoadingCheckDuplicate ? (
                    <Loading>
                      <div>Sedang Memeriksa Data Siswa</div>
                    </Loading>
                  ) : (
                    <>
                      {/* Rows */}
                      {fields.map((item, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-[2fr_1fr_auto_auto] gap-5 items-center"
                        >
                          <Textinput
                            type="text"
                            id={`name3${index}`}
                            placeholder="Nama Siswa"
                            register={register}
                            name={`students[${index}].fullname`}
                            disabled={item.student_id !== ""}
                          />

                          <Select
                            key={item.value}
                            className="react-select"
                            // classNamePrefix="select"
                            defaultValue={item.reg_stat}
                            disabled={item.student_id !== ""}
                            name={`students[${index}].reg_stat`}
                            register={register}
                            options={allStatus}
                            onChange={(
                              selectedOption // react-select passes the selected option object
                            ) =>
                              handleRegStatChange(
                                item.fullname,
                                "reg_stat",
                                selectedOption.target.value // Get value from the selected option
                              )
                            }
                            id="hh"
                          />
                          <Checkbox
                            value={
                              formList.find((x) => x.fullname === item.fullname)
                                ?.istrial
                            }
                            activeClass="ring-primary-500 bg-primary-500"
                            onChange={(e) =>
                              handleRegStatChange(
                                item.fullname,
                                "istrial",
                                e.target.checked
                              )
                            }
                            className="mx-auto"
                          />

                          <button
                            onClick={() => {
                              const studentToRemoveFullname =
                                fields[index].fullname;
                              remove(index);
                              setFormList((currentList) =>
                                currentList.filter(
                                  (s) => s.fullname !== studentToRemoveFullname
                                )
                              );
                              setSelectedProduct([]);
                              forceUpdate();
                            }}
                            type="button"
                            className="inline-flex items-center justify-center h-10 w-10 bg-danger-500 text-lg border rounded border-danger-500 text-white"
                          >
                            <Icons icon="heroicons-outline:trash" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
        {/* summary */}
        {isInvoice && selectedProduct.length > 0 && (
          // <SummarySection
          //   selectedProduct={selectedProduct}
          //   formList={formList}
          //   grouped={grouped}
          // />
          <Card title={"Ringkasan"}>
            {/* Produk */}
            <div className="mb-10">
              <span className="text-xl font-semibold mb-2">Produk</span>
              <div className="lg:grid-cols-4 md:grid-cols-4 grid-cols-1 grid gap-4 last:mb-10">
                <>
                  <span className="col-span-2 font-medium">Nama Produk</span>
                  <span className="text-left font-medium">Jumlah</span>
                  <span className="text-left font-medium">Harga</span>
                </>
                {/* untuk produk yang dipilih */}
                {selectedProduct.length > 0 &&
                  selectedProduct.map((p) => (
                    <>
                      <span className="col-span-2">{p.name}</span>
                      <span className="text-left">{p.qty}</span>
                      <div className="flex justify-between">
                        <span>IDR</span>
                        <span>
                          {(
                            p.qty *
                            (p.package_name === "trial" ? 1 : formList.length) *
                            p.sellprice
                          ).toLocaleString()}
                        </span>
                      </div>
                    </>
                  ))}
                {/* untuk registrasi */}
                {Object.entries(grouped)
                  .filter(([key]) => key !== "extend")
                  .map(([key, value]) => (
                    <React.Fragment key={key}>
                      <span className="col-span-2">Reg. {value.label}</span>
                      <span className="text-left">{value.count}</span>
                      <div className="flex justify-between">
                        <span>IDR</span>
                        <span>{value.total.toLocaleString()}</span>
                      </div>
                    </React.Fragment>
                  ))}

                {/* Subtotal Section */}
                <React.Fragment key="subtotal">
                  {/* Optional: Top border line */}
                  <div className="col-span-4 border-t-2 border-black mt-2" />

                  <span className="col-span-2 text-right font-bold">
                    Subtotal
                  </span>
                  <span></span>
                  <div className="flex justify-between font-bold">
                    <span>IDR</span>
                    <span>
                      {(
                        selectedProduct.reduce(
                          (sum, p) =>
                            sum +
                            p.qty *
                              (p.package_name === "trial"
                                ? 1
                                : formList.length) *
                              p.sellprice,
                          0
                        ) +
                        Object.values(grouped).reduce(
                          (sum, value) => sum + value.total,
                          0
                        )
                      ).toLocaleString()}
                    </span>
                  </div>

                  {/* Optional: Bottom border line */}
                  <div className="col-span-4 border-b-2 border-black mt-1" />
                </React.Fragment>
              </div>
            </div>
          </Card>
        )}
        {/* Pelanggan Section */}
        {isInvoice && parent ? (
          // <CustomerSection
          //   isSplitInvoice={isSplitInvoice}
          //   setIsSplitInvoice={setIsSplitInvoice}
          //   parent={parent}
          //   control={control}
          //   register={register}
          //   setValue={setValue}
          //   keterangan={keterangan}
          // />
          <Card
            title={"Pelanggan"}
            // di hide dulu, belum ada kebijakan split bill
            // headerslot={
            //   parent.length > 1 && (
            //     <Checkbox
            //       name="splitInvoice"
            //       label={"Split Invoice"}
            //       value={isSplitInvoice}
            //       onChange={() => {
            //         setIsSplitInvoice(!isSplitInvoice);
            //       }}
            //     />
            //   )
            // }
          >
            <div className="flex flex-col gap-3">
              {!isSplitInvoice || parent.length == 1 ? (
                <>
                  <div className="flex flex-col">
                    <label
                      htmlFor="namapelanggan"
                      className="text-sm font-medium mb-1"
                    >
                      Nama
                    </label>
                    <select
                      id="namapelanggan"
                      {...register("namapelanggan")}
                      className="border rounded-md p-2"
                      onChange={(e) => {
                        const selected = parent.find(
                          (p) => p.name === e.target.value
                        );
                        setValue("namapelanggan", selected?.name || "");
                        setValue(
                          "phonepelanggan",
                          toNormalizePhone(selected?.phone || "")
                        );
                      }}
                    >
                      <option value="">Pilih Orang Tua</option>
                      {parent.map((p, index) => (
                        <option key={index} value={p.name}>
                          {p.name} - {p.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Textinput
                    name="phonepelanggan"
                    label="Nomor Telepon"
                    type="text"
                    placeholder="Nomor WA"
                    register={register}
                  />
                  <Textarea
                    name="keteranganpelanggan"
                    label="Keterangan"
                    placeholder="Keterangan"
                    register={register}
                  ></Textarea>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3 w-full">
                  {parent.map((item, idx) => (
                    <Card key={idx} className="flex-1 min-w-0">
                      <div className="space-y-2">
                        <Textinput
                          name={`splitCustomers[${idx}].name`}
                          label="Nama"
                          type="text"
                          placeholder="Nama"
                          register={register}
                          defaultValue={item.name}
                          horizontal
                        />
                        <InputGroup
                          name={`splitCustomers[${idx}].tagihan`}
                          type="text"
                          label="Tagihan"
                          prepend="Rp."
                          register={register}
                          defaultValue={item.tagihan}
                          horizontal
                        />
                        <Textinput
                          name={`splitCustomers[${idx}].phone`}
                          label="Telepon"
                          type="text"
                          placeholder="Nomor WA"
                          register={register}
                          defaultValue={item.phone}
                          horizontal
                        />
                        <Textarea
                          name={`splitCustomers[${idx}].keterangan`}
                          label="Keterangan"
                          placeholder="Keterangan"
                          register={register}
                          defaultValue={keterangan}
                          horizontal
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ) : null}
        <div className="ltr:text-right rtl:text-left space-x-3">
          <div className="btn-group">
            <Button
              type="submit"
              className="btn btn-dark"
              disabled={selectedProduct.length === 0}
            >
              Buat Order
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};

function ProductSection({
  product,
  handleProductDisable,
  selectedProduct,
  handleQtyChange,
  handleProductSelectionChange,
  control,
  register,
}) {
  return (
    <div className="flex flex-col">
      {/* Header for Product Section */}
      <div className="grid grid-cols-[1fr_100px] gap-5">
        <label className="form-label" htmlFor="product">
          Product
        </label>
        <label className="form-label" htmlFor="jumlah">
          Jumlah Paket
        </label>
      </div>
      {/* Product Rows */}
      <div className="grid grid-cols-[1fr_100px] gap-3 mb-5 items-center">
        {product.map((option, i) => {
          const isDisabled = handleProductDisable(option.package_name);
          //  ||
          // option.package_name.toLowerCase() === "trial";

          if (isDisabled) return null;
          return (
            <React.Fragment key={`product-item-${option.product_id}`}>
              <Checkbox
                name="product"
                label={`${option.name.toLowerCase()} - Rp. ${new Intl.NumberFormat(
                  "id-ID"
                ).format(option.sellprice)}`}
                value={selectedProduct.some(
                  (p) => p.product_id === option.product_id
                )}
                onChange={() => {
                  // This onChange is for non-trial products.
                  // Trial product selection is handled automatically by istrial checkboxes.
                  if (option.package_name.toLowerCase() !== "trial") {
                    if (
                      selectedProduct.some(
                        (p) => p.product_id === option.product_id
                      )
                    )
                      handleQtyChange(option.product_id, 0);
                  }
                  handleProductSelectionChange(option);
                }}
                disabled={
                  handleProductDisable(option.package_name) ||
                  option.package_name.toLowerCase() === "trial"
                }
              />
              <Textinput
                isMask
                type="text"
                id={`qty${i}`}
                register={register}
                placeholder="0"
                className="text-right"
                options={{ numeral: true, blocks: [1] }}
                value={
                  selectedProduct
                    .find((p) => p.product_id === option.product_id)
                    ?.qty?.toString() || "0"
                }
                defaultValue={1}
                disabled={
                  !selectedProduct.some(
                    (p) => p.product_id === option.product_id
                  )
                  // || option.package_name.toLowerCase() === "trial" // Also disable qty input for trial product
                }
                onChange={(e) => {
                  let raw = e.target.rawValue || "0";
                  let val = parseInt(raw, 10);

                  // Batas nilai min dan max
                  const min = 1;
                  const max = 10; //formList.length;

                  // Koreksi nilai agar sesuai dengan batasan
                  if (val < min) val = min;
                  if (val > max) val = max;

                  handleQtyChange(option.product_id, val.toString());
                }}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function StudentSection({
  isLoadingCheckDuplicate,
  fields,
  control,
  register,
  allStatus,
  handleRegStatChange,
  formList,
  remove,
  setFormList,
  setSelectedProduct,
  forceUpdate,
}) {
  return (
    <div className="flex flex-col space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_auto_auto] gap-5 items-center">
        <span>Nama Siswa</span>
        <span>Registrasi</span>
        <span className="text-center">Trial</span>
        <span>Delete</span>
      </div>

      {isLoadingCheckDuplicate ? (
        <Loading>
          <div>Sedang Memeriksa Data Siswa</div>
        </Loading>
      ) : (
        <>
          {/* Rows */}
          {fields.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[2fr_1fr_auto_auto] gap-5 items-center"
            >
              <Textinput
                type="text"
                id={`name3${index}`}
                placeholder="Nama Siswa"
                register={register}
                name={`students[${index}].fullname`}
                disabled={item.student_id !== ""}
              />

              <Select
                key={item.value}
                className="react-select"
                // classNamePrefix="select"
                defaultValue={item.reg_stat}
                disabled={item.student_id !== ""}
                name={`students[${index}].reg_stat`}
                register={register}
                options={allStatus}
                onChange={(
                  selectedOption // react-select passes the selected option object
                ) =>
                  handleRegStatChange(
                    item.fullname,
                    "reg_stat",
                    selectedOption.target.value // Get value from the selected option
                  )
                }
                id="hh"
              />
              <Checkbox
                value={
                  formList.find((x) => x.fullname === item.fullname)?.istrial
                }
                activeClass="ring-primary-500 bg-primary-500"
                onChange={(e) =>
                  handleRegStatChange(
                    item.fullname,
                    "istrial",
                    e.target.checked
                  )
                }
                className="mx-auto"
              />

              <button
                onClick={() => {
                  const studentToRemoveFullname = fields[index].fullname;
                  remove(index);
                  setFormList((currentList) =>
                    currentList.filter(
                      (s) => s.fullname !== studentToRemoveFullname
                    )
                  );
                  setSelectedProduct([]);
                  forceUpdate();
                }}
                type="button"
                className="inline-flex items-center justify-center h-10 w-10 bg-danger-500 text-lg border rounded border-danger-500 text-white"
              >
                <Icons icon="heroicons-outline:trash" />
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function SummarySection({ selectedProduct, formList, grouped }) {
  return (
    <Card title={"Ringkasan"}>
      {/* Produk */}
      <div className="mb-10">
        <span className="text-xl font-semibold mb-2">Produk</span>
        <div className="lg:grid-cols-4 md:grid-cols-4 grid-cols-1 grid gap-4 last:mb-10">
          <>
            <span className="col-span-2 font-medium">Nama Produk</span>
            <span className="text-left font-medium">Jumlah</span>
            <span className="text-left font-medium">Harga</span>
          </>
          {/* untuk produk yang dipilih */}
          {selectedProduct.length > 0 &&
            selectedProduct.map((p) => (
              <>
                <span className="col-span-2">{p.name}</span>
                <span className="text-left">{p.qty}</span>
                <div className="flex justify-between">
                  <span>IDR</span>
                  <span>
                    {(
                      p.qty *
                      (p.package_name === "trial" ? 1 : formList.length) *
                      p.sellprice
                    ).toLocaleString()}
                  </span>
                </div>
              </>
            ))}
          {/* untuk registrasi */}
          {Object.entries(grouped)
            .filter(([key]) => key !== "extend")
            .map(([key, value]) => (
              <React.Fragment key={key}>
                <span className="col-span-2">Reg. {value.label}</span>
                <span className="text-left">{value.count}</span>
                <div className="flex justify-between">
                  <span>IDR</span>
                  <span>{value.total.toLocaleString()}</span>
                </div>
              </React.Fragment>
            ))}

          {/* Subtotal Section */}
          <React.Fragment key="subtotal">
            {/* Optional: Top border line */}
            <div className="col-span-4 border-t-2 border-black mt-2" />

            <span className="col-span-2 text-right font-bold">Subtotal</span>
            <span></span>
            <div className="flex justify-between font-bold">
              <span>IDR</span>
              <span>
                {(
                  selectedProduct.reduce(
                    (sum, p) =>
                      sum +
                      p.qty *
                        (p.package_name === "trial" ? 1 : formList.length) *
                        p.sellprice,
                    0
                  ) +
                  Object.values(grouped).reduce(
                    (sum, value) => sum + value.total,
                    0
                  )
                ).toLocaleString()}
              </span>
            </div>

            {/* Optional: Bottom border line */}
            <div className="col-span-4 border-b-2 border-black mt-1" />
          </React.Fragment>
        </div>
      </div>
    </Card>
  );
}

function CustomerSection({
  isSplitInvoice,
  setIsSplitInvoice,
  parent,
  control,
  register,
  setValue,
  keterangan,
}) {
  return (
    <Card
      title={"Pelanggan"}
      // di hide dulu, belum ada kebijakan split bill
      // headerslot={
      //   parent.length > 1 && (
      //     <Checkbox
      //       name="splitInvoice"
      //       label={"Split Invoice"}
      //       value={isSplitInvoice}
      //       onChange={() => {
      //         setIsSplitInvoice(!isSplitInvoice);
      //       }}
      //     />
      //   )
      // }
    >
      <div className="flex flex-col gap-3">
        {!isSplitInvoice || parent.length == 1 ? (
          <>
            <div className="flex flex-col">
              <label
                htmlFor="namapelanggan"
                className="text-sm font-medium mb-1"
              >
                Nama
              </label>
              <select
                id="namapelanggan"
                {...register("namapelanggan")}
                className="border rounded-md p-2"
                onChange={(e) => {
                  const selected = parent.find(
                    (p) => p.name === e.target.value
                  );
                  setValue("namapelanggan", selected?.name || "");
                  setValue(
                    "phonepelanggan",
                    toNormalizePhone(selected?.phone || "")
                  );
                }}
              >
                <option value="">Pilih Orang Tua</option>
                {parent.map((p, index) => (
                  <option key={index} value={p.name}>
                    {p.name} - {p.phone}
                  </option>
                ))}
              </select>
            </div>
            <Textinput
              name="phonepelanggan"
              label="Nomor Telepon"
              type="text"
              placeholder="Nomor WA"
              register={register}
            />
            <Textarea
              name="keteranganpelanggan"
              label="Keterangan"
              placeholder="Keterangan"
              register={register}
            ></Textarea>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3 w-full">
            {parent.map((item, idx) => (
              <Card key={idx} className="flex-1 min-w-0">
                <div className="space-y-2">
                  <Textinput
                    name={`splitCustomers[${idx}].name`}
                    label="Nama"
                    type="text"
                    placeholder="Nama"
                    register={register}
                    defaultValue={item.name}
                    horizontal
                  />
                  <InputGroup
                    name={`splitCustomers[${idx}].tagihan`}
                    type="text"
                    label="Tagihan"
                    prepend="Rp."
                    register={register}
                    defaultValue={item.tagihan}
                    horizontal
                  />
                  <Textinput
                    name={`splitCustomers[${idx}].phone`}
                    label="Telepon"
                    type="text"
                    placeholder="Nomor WA"
                    register={register}
                    defaultValue={item.phone}
                    horizontal
                  />
                  <Textarea
                    name={`splitCustomers[${idx}].keterangan`}
                    label="Keterangan"
                    placeholder="Keterangan"
                    register={register}
                    defaultValue={keterangan}
                    horizontal
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default AddJadwal;
