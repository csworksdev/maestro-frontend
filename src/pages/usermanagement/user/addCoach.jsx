import { register } from "@/axios/auth/auth";
import { getTrainerAll, getTrainerAllNew } from "@/axios/masterdata/trainer";
import PaginationComponent from "@/components/globals/table/pagination";
import Search from "@/components/globals/table/search";
import Table from "@/components/globals/table/table";
import Loading from "@/components/Loading";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Icon } from "@iconify/react";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const actions = [
  // {
  //   name: "view",
  //   icon: "heroicons-outline:eye",
  // },
  {
    name: "pilih",
    icon: "heroicons:check",
  },
];

const AddCoach = ({ handleSelectTrainer }) => {
  const [isLoading, setIsLoading] = useState(true);

  const [listData, setListData] = useState({ count: 0, results: [] });
  const [listNewData, setListNewData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // const fetchData = async (page, size, query) => {
  //   try {
  //     setIsLoading(true);
  //     const params = {
  //       page: page + 1,
  //       page_size: size,
  //       search: query,
  //       is_active: true,
  //     };
  //     getTrainerAll(params)
  //       .then((res) => {
  //         setListData(res.data);
  //       })
  //       .finally(() => setIsLoading(false));
  //   } catch (error) {
  //     console.error("Error fetching data", error);
  //   }
  // };

  const fetchDataNewTrainer = async (page, size, query) => {
    try {
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
        is_active: true,
      };
      getTrainerAllNew(params)
        .then((res) => {
          setListNewData(res.data);
        })
        .finally(() => setIsLoading(false));
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    // fetchData(pageIndex, pageSize, searchQuery);
    fetchDataNewTrainer(pageIndex, pageSize, searchQuery);
  }, [pageIndex, pageSize, searchQuery]);

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0); // Reset to first page on search
  };

  const handleUpdate = (updatedData) => {
    register(updatedData)
      .then((res) => {
        if (res) {
          Swal.fire("Edited!", "User has been edited.", "success");
          fetchDataNewTrainer(pageIndex, pageSize, searchQuery);
        }
      })
      .catch((error) => {
        Swal.fire("Error!", "There was an error editing the user.", "error");
      })
      .finally(closeModal());
  };

  const handlePilih = (e) => {
    const updatedData = {
      user_id: e.trainer_id,
      username: e.nickname,
      email: e.email,
      password: "maestrobisa",
    };
    handleUpdate(updatedData);
  };

  const COLUMNS = [
    {
      Header: "Trainer",
      accessor: "fullname",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Panggilan",
      accessor: "nickname",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => {
        return (
          <div className="flex space-x-2 items-center">
            <div className="flex space-x-2">
              {actions.map((item, i) => (
                <div
                  className={`
                  
                    ${
                      item.name === "pilih"
                        ? "bg-success-500 text-success-500 bg-opacity-30   hover:bg-opacity-100 hover:text-white"
                        : "hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 dark:hover:bg-opacity-50"
                    }
                     w-full border-b border-b-gray-500 border-opacity-10 px-4 py-2 text-sm  last:mb-0 cursor-pointer 
                     first:rounded-t last:rounded-b flex  space-x-2 items-center rtl:space-x-reverse `}
                  onClick={(e) => handlePilih(row.row.original)}
                  key={i}
                >
                  <span className="text-base">
                    <Icon icon={item.icon} />
                  </span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Modal
        title="Pilih Pelatih"
        label="Tambah Pelatih"
        labelClass="btn-outline-primary"
        themeClass="bg-primary-500"
        className="max-w-5xl"
        uncontrol
      >
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Search searchValue={searchQuery} handleSearch={handleSearch} />
            <Table
              listData={listNewData}
              listColumn={COLUMNS}
              searchValue={searchQuery}
              handleSearch={handleSearch}
            />
            <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={Math.ceil(listNewData.count / pageSize)}
              canPreviousPage={pageIndex > 0}
              canNextPage={
                pageIndex < Math.ceil(listNewData.count / pageSize) - 1
              }
              gotoPage={handlePageChange}
              previousPage={() => handlePageChange(pageIndex - 1)}
              nextPage={() => handlePageChange(pageIndex + 1)}
              setPageSize={handlePageSizeChange}
            />
          </>
        )}
      </Modal>
    </>
  );
};

export default AddCoach;
