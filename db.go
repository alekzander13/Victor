package main

import (
	"encoding/json"
	"os"
	"sync"
)

type database struct {
	mu sync.RWMutex
}

var myBase database

func (db *database) getTableContragentsStruct() ([]tableHeader, error) {
	defer db.mu.RUnlock()
	db.mu.RLock()
	var res []tableHeader
	b, err := os.ReadFile("base/contragents_struct.json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(b, &res)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (db *database) getTableContragentsData() ([]dataItemContragents, error) {
	defer db.mu.RUnlock()
	db.mu.RLock()
	var res []dataItemContragents
	b, err := os.ReadFile("base/contragents.json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(b, &res)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (db *database) setTableContragentsData(data []dataItemContragents) error {
	defer db.mu.Unlock()
	db.mu.Lock()

	body, err := json.MarshalIndent(data, "", "\t")
	if err != nil {
		return err
	}

	os.WriteFile("base/contragents.json", body, os.ModePerm)

	return nil
}

func (db *database) getTablePosData() ([]dataItemPos, error) {
	defer db.mu.RUnlock()
	db.mu.RLock()
	var res []dataItemPos
	b, err := os.ReadFile("base/pos.json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(b, &res)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (db *database) getTablePosStruct() ([]tableHeader, error) {
	defer db.mu.RUnlock()
	db.mu.RLock()
	var res []tableHeader
	b, err := os.ReadFile("base/pos_struct.json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(b, &res)
	if err != nil {
		return nil, err
	}

	return res, nil
}
