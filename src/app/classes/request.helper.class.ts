import { default as axios } from 'axios';

export class RequestHelper<T> {

    url: string;
    data: any;
    error: (error: string) => void = () => { };
    after: () => void = () => { };

    constructor() { }

    to(url: string): RequestHelper<T> {
        this.url = url;
        return this;
    }

    with(data: any): RequestHelper<T> {
        this.data = data;
        return this;
    }

    catch(error: (error: string) => void): RequestHelper<T> {
        this.error = error;
        return this;
    }

    finally(after: () => void): RequestHelper<T> {
        this.after = after;
        return this;
    }

    post(callback: (data: T) => void) {
        axios.post(this.url, this.data).then((res) => {
            if (res.data.error) {
                console.error('There was an error receiving data:', res.data.error);
                this.error(res.data.error);
                return;
            }
            if (res.status != 200 || !res.data) {
                console.error('There was an error receiving data:', res.status, res.statusText);
                this.error('There was an error receiving data, please try again');
                return;
            }
            callback(res.data);
        }).catch((reason) => {
            console.error('There was an error receiving data:', reason);
            this.error('There was an error receiving data, please try again');
        }).finally(this.after);
    }

}