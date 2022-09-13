// catatan
// clear cath

const { name } = require('ejs');
const { urlencoded } = require('express');
const express = require('express')
const app = express();
var expressLayouts = require('express-ejs-layouts');
const fs = require('fs');
const { dirname } = require('path');
const path = require('path')
const { body, validationResult, check } = require('express-validator');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
var morgan = require('morgan');



app.use(express.static('public'))
app.use(express.json())
app.set('view engine', 'ejs')
app.use(expressLayouts);
app.set('layout', 'layouts/layout');
app.use(express.urlencoded());
app.use(cookieParser('secret'));
app.use(
    session({
        cookie: { maxAge: 6000 },
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
    })
);
app.use(flash())
app.use((req, res, next) => {
    console.log('Time:', Date.now())
    next()
})
app.use(morgan(function (tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens['response-time'](req, res), 'ms'
    ].join(' ')
}));

// Membuat folder data jika belom ada
const dirPatch = './data';
if (!fs.existsSync(dirPatch)) {
    fs.mkdirSync(dirPatch);
}

// Membuat file contact jika belom ada
const dataPath = './data/contacts.json';
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]', 'utf-8');
}

// Menyimpan data ke json
const saveContact = (data) => {
    const stringifyData = JSON.stringify(data)
    fs.writeFileSync(dataPath, stringifyData)
}
// Mendapatakan semua data dari json
const getContact = () => {
    const jsonData = fs.readFileSync(dataPath)
    return JSON.parse(jsonData)
}
// Cek nama Bila sudah ada
const cekDuplikat = (name) => {
    var existAccounts = getContact();
    return existAccounts.find(user => user.name === name);
}

// Mendapatkan nama sesuai di cari
const findContact = (name) => {
    const contacts = getContact();
    const contact = contacts.find((contact) => contact.name === name);
    return contact;
}

// Update kontak
const updateCont = (contBaru) => {
    const contacts = getContact();
    const updateUser = contacts.filter(contact => contact.name !== contBaru.oldnama)
    delete contBaru.oldnama;

    updateUser.push(contBaru)
    saveContact(updateUser)
}

// Halaman Home
app.get('/', (req, res) => {
    res.render('index', {
        title: "Home Page",
        layout: 'layout/main'
    })
})

// Halaman about
app.get('/about', (req, res) => {
    res.render('about', {
        title: "About Page",
        layout: 'layout/main'
    })
})

// Halaman contact
app.get('/contact', (req, res) => {
    const cont = getContact()

    res.render('contact', {
        title: "Contact Page",
        layout: 'layout/main',
        cont,
        msg: req.flash('msg')
    })
})

// halaman form add contact
app.get('/contact/add', (req, res) => {
    const cont = getContact()

    res.render('add-contact', {
        title: "Form Tambah Kontak",
        layout: 'layout/main',
        cont,
    })
})

// Menyimpan data baru
app.post(
    '/contact/add/saveContact',
    [
        body('name').custom((value) => {
            const duplikat = cekDuplikat(value);
            if (duplikat) {
                throw new Error('Name already')
            }
            return true;
        }),
        check('email', 'Email Invalid!').isEmail()
    ],
    (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render('add-contact', {
                title: "Form Tambah Kontak",
                layout: 'layout/main',
                errors: errors.array()
            })
        } else {
            // Mengambil existing data
            var existAccounts = getContact()
            //mendapatkan data baru dari data post
            const contData = req.body

            // Ngepush sesuai dengan data yang di input
            existAccounts.push(contData)
            //Menyimpan data baru 
            saveContact(existAccounts);
            // Mengitim
            req.flash('msg', 'Data telah di tambahkan');
            // Untuk kembali ke file yang di tuju
            res.redirect('/contact');
        }
    })



// Mengedit data
app.get('/contact/edit/:name', (req, res) => {
    const contact = findContact(req.params.name)

    res.render('edit', {
        title: "Edit Contact",
        layout: 'layout/main',
        contact
    })
})

// aksi mengedit data
app.post(
    '/contact/update',
    [
        body('name').custom((value, { req }) => {
            const duplikat = cekDuplikat(value);

            if (value != req.body.oldnama && duplikat) {
                throw new Error('Name already')
            }
            return true;
        }),
        check('email', 'Email Invalid!').isEmail()
    ],
    (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render('edit', {
                title: "Form Edit Kontak",
                layout: 'layout/main',
                errors: errors.array(),
                contact: req.body,
            })
        } else {
            updateCont(req.body)
            res.redirect('/contact')
        }

    })

// Menghapus data
app.get('/contact/delete/:name', (req, res) => {
    // Membuat var untuk mengambil parameter
    const name = req.params.name
    // Mengambil existing data
    const existUsers = getContact()

    const filterUser = existUsers.filter(user => user.name !== name)
    if (existUsers.length === filterUser.length) {
        return res.send({
            error: true,
            msg: 'name does not exist'
        }).status(404)
    }
    saveContact(filterUser)
    res.render('contact', {
        success: true,
        msg: 'User data removed successfully'
    })
    req.flash('msg', 'Data telah di hapus');
    res.redirect('/contact');


})

app.get('/menu', (req, res) => {
    res.render('menu', {
        nama: 'adrian',
        title: "Menu",
        layout: 'layout/main'
    })
})
// Untuk memanggil sebuah id
app.get(('/product/:id/'), (req, res) => {
    res.send(`product id : ${req.params.id}, id category ${req.query.idCategory}`)
    // res.send('product id : ' + req.params.id + 'id category' + req.params.idCategory)
})
// app.use('/', (req, res) => {
//     res.status(404)
//     res.send(`page not found`)
// })

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})