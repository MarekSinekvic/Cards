import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import sqlite3 from 'sqlite3';
import fs from 'fs';

const mainDir = app.getAppPath();
let staticDB: sqlite3.Database;
if (!fs.existsSync(mainDir+'/../DB.sqlite')) {
  fs.createWriteStream(mainDir+'/../DB.sqlite',{autoClose:true}).write('');
  staticDB = new sqlite3.Database(mainDir+'/../DB.sqlite');
  staticDB.run("PRAGMA foreign_keys = ON");
  staticDB.serialize(()=>{
    staticDB.exec(`create table file_history(id integer primary key autoincrement, path text, date text default current_timestamp,
                                            unique(path))`);
    // staticDB.exec(`create trigger files_history_insert_limit after insert on file_history 
    //                 begin 
    //                   delete from file_history where id < (select max(id)-10 from file_history); 
    //                 end`);
    // staticDB.exec(`create table settings(id integer primary key autoincrement, key text, value text)`);
  });
} else
  staticDB = new sqlite3.Database(mainDir+'/../DB.sqlite');

console.log(mainDir+'/../DB.sqlite');

let targetFilePath = process.argv[1];
if (typeof targetFilePath === 'string') {
  if (path.extname(targetFilePath) !== '.card') targetFilePath = ':memory:';
} else targetFilePath = ':memory:'; 
let targetFile: sqlite3.Database = new sqlite3.Database(targetFilePath);
targetFile.run("PRAGMA foreign_keys = ON");
targetFile.get("select s1.name,s2.name from sqlite_master as s1 join sqlite_master as s2 on s2.name='cards_rel' where s1.name='cards'", (err, row) => {
  if (err) {
    console.log(err.name+"\n"+err.message);
    return;
  }
  if (typeof row == 'undefined') {
    targetFile.serialize(()=>{
      targetFile.exec("create table cards(id integer primary key autoincrement, content text, posx real default 0, posy real default 0, color text default '#ffffff11')");
      targetFile.exec(`create table cards_rel(id integer primary key autoincrement, 
                                          first integer not null, 
                                          second integer not null,
                                          foreign key(first) references cards(id) on delete cascade,
                                          foreign key(second) references cards(id) on delete cascade)`);

      targetFile.run(`insert into cards(content) values('First card')`);
    });
  } else console.log("tables exist");
});

staticDB.run(`insert or replace into file_history(path) values(?)`,[targetFilePath]);

let MainWindow: BrowserWindow;
function createWindow(): void {
  // Create the browser window.
  MainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  MainWindow.on('ready-to-show', () => {
    MainWindow.show();
    MainWindow.webContents.setZoomFactor(1);
  });

  MainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // MainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    MainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    MainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const ipcHandlers = {
  "cards": async () => {
    const res = await(new Promise(resolve=>{targetFile.all(`select id,content,posx,posy,color from cards`, (_,rows)=>resolve(rows));}))
    return res;
  },
  "cards:relations": async () => {
    const res = await(new Promise(resolve=>{targetFile.all(`select id,first,second from cards_rel`, (_,rows)=>resolve(rows));}))
    return res;
  },
  "cards:insert" : async (_,content:string,x:number,y:number,color:number) => {
    const res = await(new Promise(resolve=>{targetFile.get(`insert into cards(content,posx,posy,color) values(?,?,?,?) returning *`, [content,x,y,color], (_,rows)=>resolve(rows));}))
    return res;
  },
  "cards:insert:relations" : async (_,first:number,second:number) => {
    const res = await(new Promise(resolve=>{targetFile.get(`insert into cards_rel(first,second) values(?,?) returning *`, [first,second], (_,rows)=>resolve(rows));}))    
    return res;
  },
  
  "cards:update" : async (_,vars:string[], values:string[], whereClause: string) => {
    const sqlSetters = vars.map((_,i)=>`${vars[i]}=${values[i]}`).join(",");
    targetFile.run(`update cards set ${sqlSetters} where ${whereClause}`);
  },
  "cards:update:relations" : async (_,first:number,second:number, whereClause:string) => {
    targetFile.run(`update cards_rel set first=?,second=? where ${whereClause}`, [first,second]);
  },
  
  "cards:delete" : async (_,id:number) => {
    targetFile.run(`delete from cards where id=?`,id);
  },
  "cards:relations:delete" : async (_,id: number) => {
    targetFile.run(`delete from cards_rel where id=?`,id);
  },

  "files:history": async () => {
    const res = await(new Promise(resolve=>{staticDB.all(`select * from file_history order by date desc limit 100`, (_,rows)=>resolve(rows));}))
    return res;
  },
  "files:open": async (_,path:string): Promise<Error | null> => {
    if (!fs.existsSync(path)) return new Error("File not found");
    targetFilePath = path;
    targetFile = new sqlite3.Database(targetFilePath);
    staticDB.run(`insert or replace into file_history(path) values(?)`,[targetFilePath]);

    return null
  }
};

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  for (let prop in ipcHandlers) {
      ipcMain.handle(prop,ipcHandlers[prop]);
  }

  createWindow();

  // MainWindow.webContents.send("log",mainDir+'/../DB.sqlite');
  // staticDB.all(`select * from file_history`, (_,rows)=>{MainWindow.webContents.send("log",rows);});
  // MainWindow.webContents.send("log",process.argv);
  // MainWindow.webContents.send("log",targetFilePath);
  // MainWindow.webContents.send("log",path.extname(process.argv[1]));

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
