// import child from 'child-process-promise'
// import moment from 'moment';
// const si = require('systeminformation');

export class Dcom {
    constructor({ dcomName }) {
        this.dcomName = dcomName
        this.isChanged = false
    }
    change() {
        return new Promise(async(resolve, reject) => {
            let idx = 0
            do {
                idx++
                if (idx > 3) break
                await this.wait(1000)
                await this.disconnect()
                await this.connect()
                await this.handerConnected()
                if (this.isChanged) break
            } while (true);
            await this.wait(2000)
            this.isChanged ? resolve(true) : reject("Cant change IP")
        });
    }
    handerConnected() {
        return new Promise(async(resolve, reject) => {
            let isConnected = false
            let deadLine = moment().add(10, 'seconds').unix()
            do {
                if (deadLine < moment().unix()) break;
                await this.wait(500)
                let inter = await si.networkInterfaces()
                inter = inter.filter(e => e.iface == this.dcomName)
                if (inter && inter.length) {
                    isConnected = true
                    break
                }
            } while (true);
            isConnected ? this.isChanged = true : this.isChanged = false
            resolve(true)
        });
    }
    async connect() {
        try {
            await child.exec(`rasdial "${this.dcomName}"`)
        } catch (error) {
            ////console.log(error)
        }
    }
    async disconnect() {
        try {
            await child.exec(`rasdial "${this.dcomName}" /disconnect`)
        } catch (error) {

        }
    }
    wait(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve()
            }, ms);
        });
    }
}

export default Dcom
