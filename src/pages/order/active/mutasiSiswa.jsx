import { migrasiOrderById } from "@/axios/masterdata/order";
import { getTrainerAll } from "@/axios/masterdata/trainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icons from "@/components/ui/Icon";
import Select from "@/components/ui/Select";
import Textinput from "@/components/ui/Textinput";
import { toProperCase } from "@/utils";
import React, { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import Swal from "sweetalert2";

const params = {
  page: 1,
  page_size: 100,
};

const MutasiSiswaModal = ({
  defaultOrder,
  onClose = null,
  isEdit = () => {},
}) => {
  const [currentOrder, setCurrentOrder] = useState(() => {
    if (Array.isArray(defaultOrder)) {
      return defaultOrder[0] ?? {};
    }
    if (defaultOrder?.modalData) {
      return defaultOrder.modalData;
    }
    return defaultOrder ?? {};
  });

  const [listTrainer, setListTrainer] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedMeet, setSelectedMeet] = useState(null);

  const selectMenuStyles = useMemo(
    () => ({
      menuPortal: (base) => ({
        ...base,
        zIndex: 99999,
      }),
    }),
    [],
  );

  const menuPortalTarget =
    typeof window !== "undefined" ? window.document.body : null;

  const pendingMeets = useMemo(
    () =>
      (currentOrder.detail || [])
        .filter((d) => !d.is_presence)
        .map((d) => ({ value: d.meet, label: `Pertemuan ${d.meet}` })),
    [currentOrder.detail],
  );

  useEffect(() => {
    getTrainerAll(params).then((res) => {
      const formatted = res.data.results.map((t) => ({
        value: t.trainer_id,
        label: toProperCase(t.nickname),
      }));
      setListTrainer(formatted);
    });
  }, []);

  useEffect(() => {
    if (!selectedTrainer && listTrainer.length && currentOrder?.trainer_id) {
      const currentOption = listTrainer.find(
        (trainer) => trainer.value === currentOrder.trainer_id,
      );
      if (currentOption) {
        setSelectedTrainer(currentOption);
      }
    }
  }, [listTrainer, currentOrder?.trainer_id, selectedTrainer]);

  const loadTrainerOptions = (inputValue = "") =>
    Promise.resolve(
      listTrainer.filter((t) =>
        t.label.toLowerCase().includes(inputValue.toLowerCase()),
      ),
    );

  const updateOrder = async (fieldName, fieldValue, meet) => {
    try {
      const res = await migrasiOrderById(
        currentOrder.order_id,
        fieldName,
        fieldValue,
        meet,
      );

      if (res.status) {
        isEdit(true);
        Swal.fire({
          title: "Edited!",
          text: "Your order has been updated.",
          icon: "success",
          timer: 1000,
          position: "center",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const canSubmit =
    selectedTrainer &&
    selectedTrainer.value !== currentOrder.trainer_id &&
    selectedMeet !== null &&
    selectedMeet !== undefined;

  return (
    <div className="flex flex-col gap-3">
      <Card title={"Mutasi siswa ke pelatih baru"}>
        <div className="grid grid-cols-[auto,1fr,auto,auto,1fr,auto] gap-4 items-center">
          <label className="text-sm text-gray-700">Dari</label>
          <Textinput
            readOnly
            defaultValue={toProperCase(
              currentOrder.change_trainer_name ?? currentOrder.trainer_name,
            )}
          />
          <Icons icon="heroicons-outline:arrows-right-left" width={24} />
          <label className="text-sm text-gray-700">Ke</label>
          <AsyncSelect
            cacheOptions
            placeholder="Coach"
            defaultOptions={listTrainer}
            loadOptions={loadTrainerOptions}
            value={selectedTrainer}
            onChange={(option) => setSelectedTrainer(option)}
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
            styles={selectMenuStyles}
          />
          <div />
        </div>

        <div className="mt-4">
          <Select
            label="Mulai dari Pertemuan"
            id="select-meet"
            placeholder="Pilih pertemuan"
            options={pendingMeets}
            value={selectedMeet ?? ""}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelectedMeet(Number.isFinite(val) && val > 0 ? val : null);
            }}
          />
          {pendingMeets.length === 0 && (
            <p className="mt-1 text-xs text-slate-400">
              Tidak ada pertemuan yang tersisa.
            </p>
          )}
        </div>

        {canSubmit && (
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() =>
                updateOrder("mutasi", selectedTrainer.value, selectedMeet)
              }
            >
              Ganti Pelatih
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MutasiSiswaModal;
