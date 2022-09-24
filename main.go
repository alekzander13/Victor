package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jordan-wright/unindexed"
)

func main() {
	fs := http.FileServer(unindexed.Dir("templates/static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	LoadAllTemplates()

	port := "8080"
	if len(os.Args) > 1 {
		port = os.Args[1]
	}

	http.HandleFunc("/", MainHandle) //Для формування сторінки

	//http.HandleFunc("/company", CompanyHandle)

	http.HandleFunc("/loadtable", LoadTableHandle)     //Завантаження основної таблиці
	http.HandleFunc("/element", ElementHandle)         //Отримання інформації про об'єкт
	http.HandleFunc("/elementlist", ElementListHandle) //Отримання списку елементів таблиці
	http.HandleFunc("/elementedit", ElementEditHandle) //Зміна об'єкту

	srv := &http.Server{
		Addr:         ":" + port,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Printf("web server start on %s\n", port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
