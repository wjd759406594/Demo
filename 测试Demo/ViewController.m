//
//  ViewController.m
//  测试Demo
//
//  Created by dodo on 16/2/29.
//  Copyright © 2016年 jiadong. All rights reserved.
//

#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.
   
#if 0
    [self testPrint:@(0)];
    
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT,0), ^{
       
        [self testPrint:@(1)];
        [self performSelector:@selector(testPrint:) withObject:@(2) afterDelay:1];
        [self performSelector:@selector(testPrint:) withObject:@(3)];
        [self performSelector:@selector(testPrint:) withObject:@(4) afterDelay:0];
        //异步执行 延时操作还未执行 主线程已经完成 释放了全局队列
        
        //解决方法 NSRunLoop 阻塞线程 完成延时操作
      [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]];
        
    });
#endif
    
    
    NSLog(@"1");
    
    dispatch_sync(dispatch_get_main_queue(), ^{
        //dispatch_sync在等待block语句执行完成，而block语句需要在主线程里执行，所以dispatch_sync如果在主线程调用就会造成死锁
        NSLog(@"2");
    });
    
    NSLog(@"3");

    
    
}

-(void)testPrint:(id)param
{
    NSLog(@"%@",param);
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
