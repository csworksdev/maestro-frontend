import Card from "@/components/ui/Card";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  AddTrainerSpecialization,
  EditTrainerSpecialization,
} from "@/axios/referensi/trainerSpecialization";
import { getSpecializationAll } from "@/axios/referensi/specialization";
import Button from "@/components/ui/Button";

const Edit = ({
  trainerId: propTrainerId,
  data: propData,
  isupdate: propIsUpdate,
  selectedSpecializations = [],
  onSaved,
  onCancel,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isupdate = "false",
    data = {},
    trainer_id,
    current_specializations,
  } = location.state ?? {};
  const trainerId = propTrainerId || trainer_id || data?.trainer_id;
  const formData = useMemo(() => propData || data || {}, [propData, data]);
  const baseSelections = useMemo(
    () =>
      selectedSpecializations.length > 0
        ? selectedSpecializations
        : current_specializations || [],
    [selectedSpecializations, current_specializations]
  );
  const isUpdate = (propIsUpdate ?? isupdate) == "true";

  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [certification, setCertification] = useState(
    formData?.certification || ""
  );
  const [certificationLink, setCertificationLink] = useState(
    formData?.certification_link || ""
  );
  const [certificationDate, setCertificationDate] = useState(
    formData?.certification_date || ""
  );
  const [certificationExpiredDate, setCertificationExpiredDate] = useState(
    formData?.certification_expired_date || ""
  );
  const [notes, setNotes] = useState(formData?.notes || "");

  const toIdString = (value) => {
    if (value === null || value === undefined) return null;
    return String(value);
  };

  const extractIdsFromString = (value) => {
    if (typeof value !== "string") return [];
    if (value.trim().startsWith("[") && value.includes("]")) {
      const cleaned = value.replace(/[\[\]'"\s]/g, "");
      return cleaned.split(",").filter(Boolean);
    }
    return value
      .split(",")
      .map((v) => v.replace(/['"\s]/g, ""))
      .filter(Boolean);
  };

  const normalizeIds = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) {
      const result = [];
      items.forEach((item) => {
        if (typeof item === "number") result.push(toIdString(item));
        else if (typeof item === "string")
          extractIdsFromString(item).forEach((v) => result.push(toIdString(v)));
        else if (item?.specialization_id)
          result.push(toIdString(item.specialization_id));
        else if (item?.id) result.push(toIdString(item.id));
      });
      return result.filter(Boolean);
    }
    if (typeof items === "string") return extractIdsFromString(items);
    if (items?.specialization_id) return [toIdString(items.specialization_id)];
    if (items?.id) return [toIdString(items.id)];
    return [];
  };

  useEffect(() => {
    setIsLoading(true);
    const params = { page: 1, page_size: 1000 };
    getSpecializationAll(params)
      .then((res) => {
        const list = res?.data?.results || res?.data || [];
        setOptions(list);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const baseIds = normalizeIds(baseSelections);
    const initialIds =
      baseIds.length > 0
        ? baseIds
        : normalizeIds(formData?.specializations || formData?.specialization);
    setSelectedId(initialIds[0] || "");
  }, [baseSelections, formData]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    navigate(-1);
  };

  const handleSelect = (id) => {
    setSelectedId(id);
  };

  const submitData = (payload) => {
    const request = isUpdate
      ? EditTrainerSpecialization(trainerId, payload)
      : AddTrainerSpecialization(trainerId, payload);

    request
      .then((res) => {
        if (res?.status) {
          const actionText = isUpdate ? "Edited!" : "Added!";
          const successText = isUpdate
            ? "Your file has been Edited."
            : "Your file has been Added.";
          if (onSaved) {
            Swal.fire(actionText, successText, "success").then(() => onSaved());
            return;
          }
          Swal.fire(actionText, successText, "success").then(() => navigate(-1));
        } else {
          Swal.fire("Error", "Gagal menyimpan spesialisasi.", "error");
        }
      })
      .catch((err) => {
        const raw = err?.response?.data;
        const message =
          (raw && typeof raw === "object"
            ? JSON.stringify(raw)
            : raw?.message || raw?.detail) || "Gagal menyimpan spesialisasi.";
        Swal.fire("Error", message, "error");
      });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!trainerId) {
      Swal.fire("Error", "Trainer tidak ditemukan.", "error");
      return;
    }
    if (!selectedId) {
      Swal.fire("Error", "Pilih satu spesialisasi.", "error");
      return;
    }
    const cleaned = extractIdsFromString(selectedId)[0] || "";
    const payload = {
      specialization: cleaned,
      specialization_id: cleaned,
      certification,
      certification_link: certificationLink,
      certification_date: certificationDate || null,
      certification_expired_date: certificationExpiredDate || null,
      notes,
    };
    submitData(payload);
  };

  return (
    <>
      <Button
        text="Kembali"
        onClick={(e) => {
          e.preventDefault();
          handleCancel();
        }}
        type="button"
        className="bg-primary-500 text-white mb-4"
        icon="heroicons-outline:arrow-uturn-left"
      />
      <Card title="Pilih Spesialisasi Trainer">
        <form onSubmit={onSubmit} className="space-y-4 ">
          <div className="grid sm:grid-cols-2 gap-3">
            {isLoading ? (
              <p>Memuat data spesialisasi...</p>
            ) : options.length === 0 ? (
              <p>Tidak ada data spesialisasi.</p>
            ) : (
              options.map((item) => {
                const id = toIdString(item.specialization_id || item.id);
                const checked = selectedId === id;
                return (
                  <label
                    key={id}
                    className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="specialization"
                      className="form-radio"
                      checked={checked}
                      onChange={() => handleSelect(id)}
                    />
                    <span>
                      {item.name} {item.alias ? `(${item.alias})` : ""}
                    </span>
                  </label>
                );
              })
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="form-label">Nama Sertifikasi</label>
              <input
                type="text"
                className="form-control"
                value={certification}
                onChange={(e) => setCertification(e.target.value)}
                placeholder="Nama sertifikasi"
              />
            </div>
            <div className="space-y-2">
              <label className="form-label">Link Sertifikasi</label>
              <input
                type="text"
                className="form-control"
                value={certificationLink}
                onChange={(e) => setCertificationLink(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <label className="form-label">Tanggal Sertifikasi</label>
              <input
                type="date"
                className="form-control"
                value={certificationDate || ""}
                onChange={(e) => setCertificationDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="form-label">Kadaluarsa Sertifikasi</label>
              <input
                type="date"
                className="form-control"
                value={certificationExpiredDate || ""}
                onChange={(e) => setCertificationExpiredDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="form-label">Catatan</label>
              <textarea
                className="form-control"
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan"
              />
            </div>
          </div>
          <div className="ltr:text-right rtl:text-left  space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={() => handleCancel()}
            >
              batal
            </button>
            <button className="btn btn-dark  text-center">
              {isUpdate ? "Update" : "Simpan"} Spesialisasi
            </button>
          </div>
        </form>
      </Card>
    </>
  );
};

export default Edit;
