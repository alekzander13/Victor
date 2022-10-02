package main

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"
)

func ElementEditHandle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Connection", "close")
	defer r.Body.Close()
	w.Header().Set("Cache-Control", "no-store")

	if r.Method != "POST" {
		http.Error(w, "bad request method", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	switch r.FormValue("table") {
	case "contragents":
		err = editContragents(body)
	case "contragent":
		err = editContragents(body)
	case "pos":
		err = editPos(body)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write([]byte(`{"result":"ok"}`))
}

func editPos(body []byte) error {
	var obj dataItemPos

	err := json.Unmarshal(body, &obj)
	if err != nil {
		return err
	}

	data, err := myBase.getTablePosData()
	if err != nil {
		return err
	}

	if obj.ID == "0" {
		rand.Seed(time.Now().UnixNano())
		min := 1200
		max := 9000
		obj.ID = fmt.Sprintf("%d", rand.Intn(max-min+1)+min)
		data = append(data, obj)
	} else {
		for i, d := range data {
			if d.ID == obj.ID {
				data[i] = obj
			}
		}
	}

	return myBase.setTablePosData(data)
}

func editContragents(body []byte) error {
	var obj dataItemContragents

	err := json.Unmarshal(body, &obj)
	if err != nil {
		return err
	}

	data, err := myBase.getTableContragentsData()
	if err != nil {
		return err
	}

	if obj.ID == "0" {
		rand.Seed(time.Now().UnixNano())
		min := 1200
		max := 9000
		obj.ID = fmt.Sprintf("%d", rand.Intn(max-min+1)+min)
		data = append(data, obj)
	} else {
		for i, d := range data {
			if d.ID == obj.ID {
				data[i] = obj
			}
		}
	}

	return myBase.setTableContragentsData(data)
}
