import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import sqlite3 from 'sqlite3';

const preview: sqlite3.Database = new sqlite3.Database(":memory:");
preview.get("select s1.name,s2.name from sqlite_master as s1 join sqlite_master as s2 on s2.name='cards_rel' where s1.name='cards'", (err, row) => {
  if (err) {
    console.log(err.name+"\n"+err.message);
    return;
  }
  if (typeof row == 'undefined') {
    preview.serialize(()=>{
      preview.exec("create table cards(id integer primary key autoincrement, content text, posx real, posy real, color integer)");
      preview.exec(`create table cards_rel(id integer primary key autoincrement, 
                                          first integer not null, 
                                          second integer not null,
                                          foreign key(first) references cards(id),
                                          foreign key(second) references cards(id))`);

      preview.run(`insert into cards(content,posx,posy,color) values('test1',0,0,0)`);
      preview.run(`insert into cards(content,posx,posy,color) values('test2',0,0,0)`);
      preview.run(`insert into cards_rel(first,second) values(1,2)`);
      // preview.get(`select * from sqlite_master where name='cards_rel'`, (err, row) => {
      //   console.log(row); console.log(err);
      // });
    });
  } else console.log("tables exist");
});

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
  })

  MainWindow.on('ready-to-show', () => {
    MainWindow.show();
  })

  MainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    MainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    MainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  console.log(process.argv);
}

const ipcHandlers = {
  "cards": async () => {
    const res = await(new Promise(resolve=>{preview.all(`select content,posx,posy,color from cards`, (_,rows)=>resolve(rows));}))
    console.log(res);
    
    return res;
  },
  "cards:relations": async () => {
    const res = await(new Promise(resolve=>{preview.all(`select first,second from cards_rel`, (_,rows)=>resolve(rows));}))
    return res;
  },
  "cards:insert" : async (content:string,x:number,y:number,color:number) => {
    preview.run(`insert into cards(content,posx,posy,color) values(?,?,?,?)`, [content,x,y,color]);
  },
  "cards:relations:insert" : async (first:number,second:number) => {
    preview.run(`insert into cards_rel(first,second) values(?,?)`, [first,second]);
  },
  
  "cards:update" : async (vars:string[], values:string[], whereClause: string) => {
    const sqlSetters = vars.map((_,i)=>`${vars[i]}=${values[i]}`).join(",");
    preview.run(`update cards set ${sqlSetters} where ${whereClause}`, values);
  },
  "cards:relations:update" : async (first:number,second:number, whereClause:string) => {
    preview.run(`update cards_rel set first=?,second=? where ${whereClause}`, [first,second]);
  },
  
  "cards:delete" : async (id:number) => {
    preview.run(`delete from cards where id=?`,id);
  },
  "cards:relations:delete" : async (id: number) => {
    preview.run(`delete from cards_rel where id=?`,id);
  },
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
