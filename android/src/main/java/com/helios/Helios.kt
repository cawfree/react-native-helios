package com.helios

external fun helloDirect(to: String): String

fun loadRustyLib() {
    System.loadLibrary("helios")
}
