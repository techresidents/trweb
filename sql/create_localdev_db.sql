create role techresidents;
alter role techresidents with NOSUPERUSER INHERIT CREATEROLE CREATEDB LOGIN PASSWORD 'techresidents';
alter role techresidents set timezone to 'UTC';
alter role techresidents set default_transaction_isolation to 'read committed';
alter role techresidents set client_encoding to 'UTF8';

create database localdev_techresidents OWNER=techresidents;
