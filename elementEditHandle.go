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

	var obj dataItem

	err = json.Unmarshal(body, &obj)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data, err := myBase.getTableData()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
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
				d.Adress = obj.Adress
				d.Name = obj.Name
				d.Pos = obj.Pos

				data[i] = d
			}
		}
	}

	err = myBase.setTableData(data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write([]byte(`{"result":"ok"}`))
}
